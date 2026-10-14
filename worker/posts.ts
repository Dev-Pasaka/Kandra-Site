import { Hono } from "hono";
import { HttpError, cleanTags, cleanText, isStaff, normalizeUrl, requireUser, type AppEnv, type Ctx, type SessionUser } from "./lib";
import { attachMedia } from "./media";
import { renderMarkdown } from "./markdown";

const BODY_MAX = 100_000;
const DAILY_POSTS = 5;
const PAGE_SIZE = 20;
const TRUSTED_AFTER = 3;
const WORDS_PER_MINUTE = 220;

export interface PostRow {
  id: number;
  user_id: number;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  canonical_url: string | null;
  status: "draft" | "pending" | "approved" | "rejected";
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  login: string;
  name: string | null;
  avatar_url: string | null;
  tags: string | null;
}

export const SELECT_POST = `
  SELECT p.*, u.login, u.name, u.avatar_url,
         (SELECT group_concat(tag) FROM post_tags t WHERE t.post_id = p.id) AS tags
    FROM posts p JOIN users u ON u.id = p.user_id`;

export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE));
}

export function postJson(r: PostRow, withBody = false) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    status: r.status,
    rejectReason: r.reject_reason,
    canonicalUrl: r.canonical_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
    readingMinutes: readingMinutes(r.body_md),
    tags: r.tags ? r.tags.split(",").sort() : [],
    author: { id: r.user_id, login: r.login, name: r.name, avatarUrl: r.avatar_url },
    ...(withBody ? { body: r.body_md } : {}),
  };
}

export async function isTrusted(c: Ctx, user: SessionUser): Promise<boolean> {
  if (isStaff(user)) return true;
  const row = await c.env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM submissions WHERE user_id = ?1 AND status = 'approved')
          + (SELECT COUNT(*) FROM posts WHERE user_id = ?1 AND status = 'approved') AS n`,
  )
    .bind(user.id)
    .first<{ n: number }>();
  return row!.n >= TRUSTED_AFTER;
}

function readInput(body: Record<string, unknown>) {
  const title = cleanText(body.title, "Title", 8, 120);
  const summary = cleanText(body.summary, "Summary", 20, 300);
  if (typeof body.body !== "string" || body.body.trim().length < 50) throw new HttpError(400, "The post needs at least 50 characters");
  if (body.body.length > BODY_MAX) throw new HttpError(413, "Posts can be at most 100,000 characters");
  const canonical = body.canonicalUrl ? normalizeUrl(body.canonicalUrl).url : null;
  return { title, summary, markdown: body.body.replace(/\r\n/g, "\n"), canonical, tags: cleanTags(body.tags) };
}

async function ownPost(c: Ctx, id: number, user: SessionUser): Promise<PostRow> {
  const row = await c.env.DB.prepare(`${SELECT_POST} WHERE p.id = ?`).bind(id).first<PostRow>();
  if (!row) throw new HttpError(404, "Not found");
  if (row.user_id !== user.id && !isStaff(user)) throw new HttpError(403, "Not yours");
  return row;
}

async function writeTags(c: Ctx, postId: number, tags: string[]) {
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM post_tags WHERE post_id = ?`).bind(postId),
    ...tags.map((t) => c.env.DB.prepare(`INSERT INTO post_tags (post_id, tag) VALUES (?, ?)`).bind(postId, t)),
  ]);
}

async function body(c: Ctx): Promise<Record<string, unknown>> {
  return c.req.json<Record<string, unknown>>().catch(() => ({}));
}

export const posts = new Hono<AppEnv>();

posts.get("/", async (c) => {
  const tag = cleanTags([c.req.query("tag")])[0];
  const page = Math.max(0, Math.min(100, Number.parseInt(c.req.query("page") ?? "0", 10) || 0));
  const binds: (string | number)[] = [];
  let where = `p.status = 'approved' AND u.banned = 0`;
  if (tag) {
    binds.push(tag);
    where += ` AND EXISTS (SELECT 1 FROM post_tags t WHERE t.post_id = p.id AND t.tag = ?)`;
  }
  const { results } = await c.env.DB.prepare(
    `${SELECT_POST} WHERE ${where} ORDER BY p.published_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${page * PAGE_SIZE}`,
  )
    .bind(...binds)
    .all<PostRow>();
  return c.json({ items: results.slice(0, PAGE_SIZE).map((r) => postJson(r)), hasMore: results.length > PAGE_SIZE });
});

posts.get("/tags", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT t.tag, COUNT(*) AS count FROM post_tags t JOIN posts p ON p.id = t.post_id JOIN users u ON u.id = p.user_id
      WHERE p.status = 'approved' AND u.banned = 0 GROUP BY t.tag ORDER BY count DESC, t.tag LIMIT 30`,
  ).all<{ tag: string; count: number }>();
  return c.json({ tags: results });
});

// The editor loads a post (with its Markdown) by id; only the author or a moderator can.
posts.get("/:id{[0-9]+}", async (c) => {
  const row = await ownPost(c, Number(c.req.param("id")), requireUser(c));
  return c.json(postJson(row, true));
});

posts.post("/preview", async (c) => {
  requireUser(c);
  const b = await body(c);
  const source = typeof b.body === "string" ? b.body.slice(0, BODY_MAX) : "";
  return c.json({ html: renderMarkdown(source) });
});

posts.post("/", async (c) => {
  const user = requireUser(c);
  const input = readInput(await body(c));
  const today = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM posts WHERE user_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`,
  )
    .bind(user.id)
    .first<{ n: number }>();
  if (today!.n >= DAILY_POSTS && !isStaff(user)) throw new HttpError(429, `You can start ${DAILY_POSTS} posts a day`);

  const tmp = `tmp-${crypto.randomUUID()}`;
  const row = await c.env.DB.prepare(
    `INSERT INTO posts (user_id, slug, title, summary, body_md, canonical_url) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(user.id, tmp, input.title, input.summary, input.markdown, input.canonical)
    .first<{ id: number }>();
  const id = row!.id;
  const base = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const slug = `${base}-${id}`;
  await c.env.DB.prepare(`UPDATE posts SET slug = ? WHERE id = ?`).bind(slug, id).run();
  await writeTags(c, id, input.tags);
  await attachMedia(c, id, user.id, input.markdown);
  return c.json({ id, slug, status: "draft" }, 201);
});

posts.put("/:id{[0-9]+}", async (c) => {
  const user = requireUser(c);
  const row = await ownPost(c, Number(c.req.param("id")), user);
  const input = readInput(await body(c));
  // Editing a published post sends it back to review unless the author is trusted.
  let status = row.status;
  if (row.status === "rejected") status = "draft";
  if (row.status === "approved" && !(await isTrusted(c, user))) status = "pending";
  await c.env.DB.prepare(
    `UPDATE posts SET title = ?, summary = ?, body_md = ?, canonical_url = ?, status = ?, reject_reason = NULL,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
  )
    .bind(input.title, input.summary, input.markdown, input.canonical, status, row.id)
    .run();
  await writeTags(c, row.id, input.tags);
  await attachMedia(c, row.id, row.user_id, input.markdown);
  return c.json({ id: row.id, slug: row.slug, status });
});

posts.post("/:id{[0-9]+}/submit", async (c) => {
  const user = requireUser(c);
  const row = await ownPost(c, Number(c.req.param("id")), user);
  if (row.status === "approved" || row.status === "pending") return c.json({ status: row.status, slug: row.slug });
  const publish = await isTrusted(c, user);
  await c.env.DB.prepare(
    `UPDATE posts SET status = ?, published_at = CASE WHEN ? THEN COALESCE(published_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) END
      WHERE id = ?`,
  )
    .bind(publish ? "approved" : "pending", publish ? 1 : 0, row.id)
    .run();
  return c.json({ status: publish ? "approved" : "pending", slug: row.slug });
});

posts.delete("/:id{[0-9]+}", async (c) => {
  const user = requireUser(c);
  const row = await ownPost(c, Number(c.req.param("id")), user);
  await c.env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(row.id).run();
  return c.json({ ok: true });
});

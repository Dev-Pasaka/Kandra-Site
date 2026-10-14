import { Hono } from "hono";
import {
  HttpError,
  cleanTags,
  cleanText,
  isPublicHostname,
  isStaff,
  normalizeUrl,
  requireUser,
  verifyTurnstile,
  type AppEnv,
} from "./lib";

const KINDS = ["link", "resource"] as const;
const RESOURCE_TYPES = ["library", "sample", "talk", "tool", "template", "guide"] as const;
const PAGE_SIZE = 30;
/** Approved submissions after which a member's new submissions skip the queue. */
const TRUSTED_AFTER = 3;
const DAILY_LIMIT = 5;

export interface SubmissionRow {
  id: number;
  kind: string;
  url: string;
  title: string;
  summary: string;
  resource_type: string | null;
  kandra_version: string | null;
  status: string;
  reject_reason: string | null;
  created_at: string;
  published_at: string | null;
  user_id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  votes: number;
  voted: number;
  tags: string | null;
}

export const SELECT_SUBMISSION = `
  SELECT s.id, s.kind, s.url, s.title, s.summary, s.resource_type, s.kandra_version, s.status,
         s.reject_reason, s.created_at, s.published_at, s.user_id, u.login, u.name, u.avatar_url,
         (SELECT COUNT(*) FROM votes v WHERE v.submission_id = s.id) AS votes,
         EXISTS (SELECT 1 FROM votes v WHERE v.submission_id = s.id AND v.user_id = ?1) AS voted,
         (SELECT group_concat(tag) FROM submission_tags t WHERE t.submission_id = s.id) AS tags
    FROM submissions s JOIN users u ON u.id = s.user_id`;

export function toJson(r: SubmissionRow) {
  return {
    id: r.id,
    kind: r.kind,
    url: r.url,
    domain: new URL(r.url).hostname.replace(/^www\./, ""),
    title: r.title,
    summary: r.summary,
    resourceType: r.resource_type,
    kandraVersion: r.kandra_version,
    status: r.status,
    rejectReason: r.reject_reason,
    createdAt: r.created_at,
    publishedAt: r.published_at,
    votes: r.votes,
    voted: !!r.voted,
    tags: r.tags ? r.tags.split(",").sort() : [],
    author: { id: r.user_id, login: r.login, name: r.name, avatarUrl: r.avatar_url },
  };
}

function pick<T extends readonly string[]>(value: string | undefined, allowed: T): T[number] | undefined {
  return allowed.includes(value ?? "") ? (value as T[number]) : undefined;
}

export const submissions = new Hono<AppEnv>();

// Public feed: approved only.
submissions.get("/", async (c) => {
  const kind = pick(c.req.query("kind"), KINDS) ?? "link";
  const sort = c.req.query("sort") === "top" ? "top" : "new";
  const tag = cleanTags([c.req.query("tag")])[0];
  const type = pick(c.req.query("type"), RESOURCE_TYPES);
  const page = Math.max(0, Math.min(100, Number.parseInt(c.req.query("page") ?? "0", 10) || 0));
  const viewer = c.get("user")?.id ?? 0;

  const where = [`s.kind = ?2`, `s.status = 'approved'`, `u.banned = 0`];
  const binds: (string | number)[] = [viewer, kind];
  if (tag) {
    binds.push(tag);
    where.push(`EXISTS (SELECT 1 FROM submission_tags t WHERE t.submission_id = s.id AND t.tag = ?${binds.length})`);
  }
  if (type) {
    binds.push(type);
    where.push(`s.resource_type = ?${binds.length}`);
  }
  const order = sort === "top" ? `votes DESC, s.published_at DESC` : `s.published_at DESC`;
  const { results } = await c.env.DB.prepare(
    `${SELECT_SUBMISSION} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ${PAGE_SIZE + 1} OFFSET ${page * PAGE_SIZE}`,
  )
    .bind(...binds)
    .all<SubmissionRow>();
  return c.json({ items: results.slice(0, PAGE_SIZE).map(toJson), hasMore: results.length > PAGE_SIZE });
});

submissions.get("/tags", async (c) => {
  const kind = pick(c.req.query("kind"), KINDS) ?? "link";
  const { results } = await c.env.DB.prepare(
    `SELECT t.tag, COUNT(*) AS count FROM submission_tags t
       JOIN submissions s ON s.id = t.submission_id JOIN users u ON u.id = s.user_id
      WHERE s.kind = ? AND s.status = 'approved' AND u.banned = 0 GROUP BY t.tag ORDER BY count DESC, t.tag LIMIT 30`,
  )
    .bind(kind)
    .all<{ tag: string; count: number }>();
  return c.json({ tags: results });
});

submissions.post("/", async (c) => {
  const user = requireUser(c);
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  await verifyTurnstile(c, body.turnstileToken);

  const kind = pick(String(body.kind ?? ""), KINDS);
  if (!kind) throw new HttpError(400, "kind must be link or resource");
  const { url, key } = normalizeUrl(body.url);
  const title = cleanText(body.title, "Title", 8, 140);
  const summary = cleanText(body.summary, "Summary", 20, 400);
  const tags = cleanTags(body.tags);
  const resourceType = kind === "resource" ? pick(String(body.resourceType ?? ""), RESOURCE_TYPES) : undefined;
  if (kind === "resource" && !resourceType) throw new HttpError(400, `resourceType must be one of ${RESOURCE_TYPES.join(", ")}`);
  const kandraVersion =
    typeof body.kandraVersion === "string" && /^\d+\.\d+\.\d+$/.test(body.kandraVersion.trim()) ? body.kandraVersion.trim() : null;

  const stats = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM submissions WHERE user_id = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')) AS today,
       (SELECT COUNT(*) FROM submissions WHERE user_id = ?1 AND status = 'approved') AS approved,
       (SELECT COUNT(*) FROM submissions WHERE url_key = ?2) AS duplicate`,
  )
    .bind(user.id, key)
    .first<{ today: number; approved: number; duplicate: number }>();
  if (stats!.duplicate) throw new HttpError(409, "That link has already been submitted");
  if (stats!.today >= DAILY_LIMIT && !isStaff(user)) throw new HttpError(429, `You can submit ${DAILY_LIMIT} items a day`);

  const autoApprove = isStaff(user) || stats!.approved >= TRUSTED_AFTER;
  const row = await c.env.DB.prepare(
    `INSERT INTO submissions (kind, user_id, url, url_key, title, summary, resource_type, kandra_version, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') END)
     RETURNING id`,
  )
    .bind(kind, user.id, url, key, title, summary, resourceType ?? null, kandraVersion, autoApprove ? "approved" : "pending", autoApprove ? 1 : 0)
    .first<{ id: number }>();
  if (tags.length) {
    await c.env.DB.batch(
      tags.map((t) => c.env.DB.prepare(`INSERT INTO submission_tags (submission_id, tag) VALUES (?, ?)`).bind(row!.id, t)),
    );
  }
  return c.json({ id: row!.id, status: autoApprove ? "approved" : "pending" }, 201);
});

submissions.delete("/:id{[0-9]+}", async (c) => {
  const user = requireUser(c);
  const id = Number(c.req.param("id"));
  const row = await c.env.DB.prepare(`SELECT user_id FROM submissions WHERE id = ?`).bind(id).first<{ user_id: number }>();
  if (!row) throw new HttpError(404, "Not found");
  if (row.user_id !== user.id && !isStaff(user)) throw new HttpError(403, "Not yours");
  await c.env.DB.prepare(`DELETE FROM submissions WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

submissions.post("/:id{[0-9]+}/vote", async (c) => {
  const user = requireUser(c);
  const id = Number(c.req.param("id"));
  const ok = await c.env.DB.prepare(`SELECT 1 FROM submissions WHERE id = ? AND status = 'approved'`).bind(id).first();
  if (!ok) throw new HttpError(404, "Not found");
  const removed = await c.env.DB.prepare(`DELETE FROM votes WHERE submission_id = ? AND user_id = ? RETURNING 1`).bind(id, user.id).first();
  if (!removed) await c.env.DB.prepare(`INSERT INTO votes (submission_id, user_id) VALUES (?, ?)`).bind(id, user.id).run();
  const count = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM votes WHERE submission_id = ?`).bind(id).first<{ n: number }>();
  return c.json({ voted: !removed, votes: count!.n });
});

submissions.post("/:id{[0-9]+}/report", async (c) => {
  const user = requireUser(c);
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const reason = cleanText(body.reason, "Reason", 3, 300);
  const ok = await c.env.DB.prepare(`SELECT 1 FROM submissions WHERE id = ?`).bind(id).first();
  if (!ok) throw new HttpError(404, "Not found");
  await c.env.DB.prepare(
    `INSERT INTO reports (submission_id, user_id, reason) VALUES (?, ?, ?)
     ON CONFLICT (submission_id, user_id) DO UPDATE SET reason = excluded.reason, resolved = 0`,
  )
    .bind(id, user.id, reason)
    .run();
  return c.json({ ok: true });
});

// Fills the submit form's title/summary from the page's own metadata.
submissions.post("/unfurl", async (c) => {
  requireUser(c);
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const { url } = normalizeUrl(body.url);
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "kandra-site-unfurl (+https://kandra-site.dev-pasaka.workers.dev/community)", Accept: "text/html" },
    });
  } catch {
    throw new HttpError(502, "Couldn't reach that page");
  }
  if (!isPublicHostname(new URL(res.url).hostname)) throw new HttpError(400, "url must point to a public website");
  if (!res.ok || !(res.headers.get("Content-Type") ?? "").includes("text/html")) return c.json({ title: "", summary: "" });

  // Only the <head> matters; stop after 256 KB.
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let html = "";
  while (html.length < 256_000) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
    if (html.includes("</head>")) break;
  }
  await reader.cancel().catch(() => {});

  const meta = (name: string) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0];
    return tag?.match(/content=["']([^"']*)["']/i)?.[1];
  };
  const decode = (s = "") =>
    s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
  const title = decode(meta("og:title") ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
  const summary = decode(meta("og:description") ?? meta("description"));
  return c.json({ title: title.slice(0, 140), summary: summary.slice(0, 400) });
});

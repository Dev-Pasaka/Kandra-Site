import { Hono } from "hono";
import { HttpError, cleanText, requireStaff, type AppEnv } from "./lib";
import { SELECT_POST, postJson, type PostRow } from "./posts";
import { SELECT_SUBMISSION, toJson, type SubmissionRow } from "./submissions";

export const admin = new Hono<AppEnv>();

admin.use(async (c, next) => {
  requireStaff(c);
  await next();
});

admin.get("/queue", async (c) => {
  const me = c.get("user")!.id;
  const [pending, reports, pendingPosts] = await Promise.all([
    c.env.DB.prepare(`${SELECT_SUBMISSION} WHERE s.status = 'pending' ORDER BY s.created_at ASC LIMIT 100`)
      .bind(me)
      .all<SubmissionRow>(),
    c.env.DB.prepare(
      `SELECT r.id, r.reason, r.created_at, r.submission_id, ru.login AS reporter, s.title, s.url, s.status
         FROM reports r JOIN users ru ON ru.id = r.user_id JOIN submissions s ON s.id = r.submission_id
        WHERE r.resolved = 0 ORDER BY r.created_at ASC LIMIT 100`,
    ).all<{ id: number; reason: string; created_at: string; submission_id: number; reporter: string; title: string; url: string; status: string }>(),
    c.env.DB.prepare(`${SELECT_POST} WHERE p.status = 'pending' ORDER BY p.updated_at ASC LIMIT 100`).all<PostRow>(),
  ]);
  return c.json({
    pending: pending.results.map(toJson),
    reports: reports.results,
    posts: pendingPosts.results.map((r) => postJson(r)),
  });
});

admin.post("/submissions/:id{[0-9]+}", async (c) => {
  const me = c.get("user")!;
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  if (body.action === "approve") {
    const r = await c.env.DB.prepare(
      `UPDATE submissions SET status = 'approved', reviewed_by = ?, reject_reason = NULL,
         published_at = COALESCE(published_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       WHERE id = ? RETURNING id`,
    )
      .bind(me.id, id)
      .first();
    if (!r) throw new HttpError(404, "Not found");
  } else if (body.action === "reject") {
    const reason = body.reason ? cleanText(body.reason, "Reason", 3, 300) : null;
    const r = await c.env.DB.prepare(
      `UPDATE submissions SET status = 'rejected', reviewed_by = ?, reject_reason = ? WHERE id = ? RETURNING id`,
    )
      .bind(me.id, reason, id)
      .first();
    if (!r) throw new HttpError(404, "Not found");
  } else {
    throw new HttpError(400, "action must be approve or reject");
  }
  return c.json({ ok: true });
});

admin.post("/posts/:id{[0-9]+}", async (c) => {
  const me = c.get("user")!;
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  let r;
  if (body.action === "approve") {
    r = await c.env.DB.prepare(
      `UPDATE posts SET status = 'approved', reviewed_by = ?, reject_reason = NULL,
         published_at = COALESCE(published_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       WHERE id = ? RETURNING id`,
    )
      .bind(me.id, id)
      .first();
  } else if (body.action === "reject") {
    const reason = body.reason ? cleanText(body.reason, "Reason", 3, 300) : null;
    r = await c.env.DB.prepare(`UPDATE posts SET status = 'rejected', reviewed_by = ?, reject_reason = ? WHERE id = ? RETURNING id`)
      .bind(me.id, reason, id)
      .first();
  } else {
    throw new HttpError(400, "action must be approve or reject");
  }
  if (!r) throw new HttpError(404, "Not found");
  return c.json({ ok: true });
});

admin.post("/reports/:id{[0-9]+}/resolve", async (c) => {
  await c.env.DB.prepare(`UPDATE reports SET resolved = 1 WHERE id = ?`).bind(Number(c.req.param("id"))).run();
  return c.json({ ok: true });
});

// Bans sign the user out everywhere and pull their unreviewed submissions.
admin.post("/users/:id{[0-9]+}/ban", async (c) => {
  const me = c.get("user")!;
  const id = Number(c.req.param("id"));
  if (id === me.id) throw new HttpError(400, "You can't ban yourself");
  const target = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(id).first<{ role: string }>();
  if (!target) throw new HttpError(404, "Not found");
  if (target.role === "admin") throw new HttpError(403, "Admins can't be banned here");
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE users SET banned = 1 WHERE id = ?`).bind(id),
    c.env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id),
    c.env.DB.prepare(`UPDATE submissions SET status = 'rejected', reject_reason = 'Account banned' WHERE user_id = ? AND status = 'pending'`).bind(id),
    c.env.DB.prepare(`UPDATE posts SET status = 'rejected', reject_reason = 'Account banned' WHERE user_id = ? AND status = 'pending'`).bind(id),
  ]);
  return c.json({ ok: true });
});

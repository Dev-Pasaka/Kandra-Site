import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { admin } from "./admin";
import { auth, loadSessionUser } from "./auth";
import { HttpError, requireUser, type AppEnv } from "./lib";
import { deleteUserMedia, media, serveMedia } from "./media";
import { renderPostPage } from "./post-page";
import { SELECT_POST, postJson, posts, type PostRow } from "./posts";
import { SELECT_SUBMISSION, submissions, toJson, type SubmissionRow } from "./submissions";

// The site itself is a static Next.js export served from ./out. wrangler.jsonc sends only these
// paths through this Worker (assets.run_worker_first); everything else never reaches this code:
//   /api/*              JSON API
//   /media/*            uploaded images and videos (R2)
//   /community/p/*      community posts, rendered into a static shell

const app = new Hono<AppEnv>();

app.use(async (c, next) => {
  // Cookie-authenticated writes must come from this site's own pages (CSRF), on top of SameSite=Lax.
  if (c.req.method !== "GET" && c.req.method !== "HEAD" && !c.req.path.startsWith("/api/auth/callback")) {
    const origin = c.req.header("Origin");
    if (!origin || origin !== new URL(c.req.url).origin) throw new HttpError(403, "Cross-site request blocked");
  }
  c.set("user", await loadSessionUser(c));
  await next();
  if (!c.res.headers.has("Cache-Control")) c.res.headers.set("Cache-Control", "no-store");
});

const api = new Hono<AppEnv>();
api.route("/auth", auth);
api.route("/submissions", submissions);
api.route("/posts", posts);
api.route("/media", media);
api.route("/admin", admin);

api.get("/me", (c) => {
  const u = c.get("user");
  return c.json({ user: u ? { id: u.id, login: u.login, name: u.name, avatarUrl: u.avatar_url, role: u.role } : null });
});

api.get("/me/submissions", async (c) => {
  const user = requireUser(c);
  const { results } = await c.env.DB.prepare(`${SELECT_SUBMISSION} WHERE s.user_id = ?1 ORDER BY s.created_at DESC LIMIT 100`)
    .bind(user.id)
    .all<SubmissionRow>();
  return c.json({ items: results.map(toJson) });
});

api.get("/me/posts", async (c) => {
  const user = requireUser(c);
  const { results } = await c.env.DB.prepare(`${SELECT_POST} WHERE p.user_id = ? ORDER BY p.updated_at DESC LIMIT 100`)
    .bind(user.id)
    .all<PostRow>();
  return c.json({ items: results.map((r) => postJson(r)) });
});

// Deletes the account and everything it submitted, wrote, uploaded, voted or reported. D1 rows go
// through ON DELETE CASCADE (D1 enforces foreign keys by default); R2 objects are removed first.
api.delete("/me", async (c) => {
  const user = requireUser(c);
  await deleteUserMedia(c, user.id);
  await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(user.id).run();
  return c.json({ ok: true });
});

api.notFound((c) => c.json({ error: "Not found" }, 404));

app.route("/api", api);
app.get("/media/*", serveMedia);
app.get("/community/p/:slug", renderPostPage);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Something went wrong" }, 500);
});

export default app;

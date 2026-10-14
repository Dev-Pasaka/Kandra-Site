import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { HttpError, SESSION_COOKIE, SESSION_DAYS, isLocalhost, randomId, type AppEnv, type Ctx, type SessionUser } from "./lib";

const STATE_COOKIE = "kandra_oauth_state";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

/** Same-site relative path only, so `next` can't be used as an open redirect. */
function safeNext(value: string | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/community";
}

function cookieOpts(c: Ctx, maxAge: number) {
  return {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

export async function loadSessionUser(c: Ctx): Promise<SessionUser | null> {
  const id = getCookie(c, SESSION_COOKIE);
  if (!id || !/^[0-9a-f]{64}$/.test(id)) return null;
  return c.env.DB.prepare(
    `SELECT u.id, u.login, u.name, u.avatar_url, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AND u.banned = 0`,
  )
    .bind(id)
    .first<SessionUser>();
}

async function upsertUser(c: Ctx, gh: GitHubUser): Promise<number> {
  const admins = (c.env.ADMIN_GITHUB_LOGINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = admins.includes(gh.login.toLowerCase());
  const row = await c.env.DB.prepare(
    `INSERT INTO users (github_id, login, name, avatar_url, role) VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT (github_id) DO UPDATE SET
       login = excluded.login, name = excluded.name, avatar_url = excluded.avatar_url,
       role = CASE WHEN ?6 THEN 'admin' WHEN users.role = 'admin' THEN 'member' ELSE users.role END
     RETURNING id, banned`,
  )
    .bind(gh.id, gh.login, gh.name, gh.avatar_url, isAdmin ? "admin" : "member", isAdmin ? 1 : 0)
    .first<{ id: number; banned: number }>();
  if (!row) throw new HttpError(502, "Could not save user");
  if (row.banned) throw new HttpError(403, "This account can't sign in");
  return row.id;
}

async function startSession(c: Ctx, userId: number): Promise<void> {
  const id = randomId();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM sessions WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`),
    c.env.DB.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`).bind(id, userId, expires),
  ]);
  setCookie(c, SESSION_COOKIE, id, cookieOpts(c, SESSION_DAYS * 86400));
}

export const auth = new Hono<AppEnv>();

auth.get("/github", (c) => {
  if (!c.env.GITHUB_CLIENT_ID) throw new HttpError(502, "GitHub sign-in isn't configured");
  const state = randomId(16);
  const next = safeNext(c.req.query("next"));
  setCookie(c, STATE_COOKIE, `${state}:${encodeURIComponent(next)}`, cookieOpts(c, 600));
  const redirect = new URL("/api/auth/callback", c.req.url).toString();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", c.env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");
  // No scopes: we only read the public profile.
  return c.redirect(url.toString());
});

auth.get("/callback", async (c) => {
  const [state, next] = (getCookie(c, STATE_COOKIE) ?? "").split(":");
  deleteCookie(c, STATE_COOKIE, { path: "/" });
  const code = c.req.query("code");
  if (!code || !state || state !== c.req.query("state")) throw new HttpError(400, "Sign-in expired, try again");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL("/api/auth/callback", c.req.url).toString(),
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new HttpError(502, "GitHub didn't return a token");

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token.access_token}`, "User-Agent": "kandra-site", Accept: "application/vnd.github+json" },
  });
  if (!userRes.ok) throw new HttpError(502, "Couldn't read your GitHub profile");
  const gh = (await userRes.json()) as GitHubUser;

  await startSession(c, await upsertUser(c, gh));
  return c.redirect(safeNext(decodeURIComponent(next ?? "")));
});

// Local testing without a GitHub OAuth app: DEV_LOGIN=1 in .dev.vars, and only on localhost.
auth.get("/dev-login", async (c) => {
  if (c.env.DEV_LOGIN !== "1" || !isLocalhost(c.req.url)) throw new HttpError(404, "Not found");
  const login = (c.req.query("login") ?? "dev").replace(/[^A-Za-z0-9-]/g, "").slice(0, 39) || "dev";
  let hash = 0;
  for (const ch of login) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const userId = await upsertUser(c, { id: -Math.abs(hash || 1), login, name: login, avatar_url: "" });
  await startSession(c, userId);
  return c.redirect(safeNext(c.req.query("next")));
});

auth.post("/logout", async (c) => {
  const id = getCookie(c, SESSION_COOKIE);
  if (id) await c.env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(id).run();
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

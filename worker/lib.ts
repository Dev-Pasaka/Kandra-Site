import type { Context } from "hono";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  /** Comma-separated GitHub logins that get the admin role on sign-in. */
  ADMIN_GITHUB_LOGINS?: string;
  /** Unset = Turnstile checks are skipped (local dev). */
  TURNSTILE_SECRET_KEY?: string;
  /** "1" enables /api/auth/dev-login on localhost only. Never set in production. */
  DEV_LOGIN?: string;
}

export interface SessionUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  role: "member" | "moderator" | "admin";
}

export type AppEnv = { Bindings: Env; Variables: { user: SessionUser | null } };
export type Ctx = Context<AppEnv>;

export const SESSION_COOKIE = "kandra_session";
export const SESSION_DAYS = 30;

export function randomId(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isLocalhost(url: string): boolean {
  const h = new URL(url).hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function isStaff(user: SessionUser | null): boolean {
  return !!user && (user.role === "admin" || user.role === "moderator");
}

export class HttpError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 502,
    message: string,
  ) {
    super(message);
  }
}

/** Strips control characters, collapses whitespace, and enforces length bounds. */
export function cleanText(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") throw new HttpError(400, `${field} is required`);
  const s = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (s.length < min) throw new HttpError(400, `${field} must be at least ${min} characters`);
  if (s.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return s;
}

const TRACKING_PARAMS = /^(utm_\w+|ref|ref_src|fbclid|gclid|mc_cid|mc_eid)$/i;

/** Validates a public http(s) URL and returns it plus a normalized key for duplicate detection. */
export function normalizeUrl(value: unknown): { url: string; key: string; domain: string } {
  if (typeof value !== "string" || value.length > 2000) throw new HttpError(400, "url is required");
  let u: URL;
  try {
    u = new URL(value.trim());
  } catch {
    throw new HttpError(400, "url is not a valid URL");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new HttpError(400, "url must be http or https");
  if (u.username || u.password) throw new HttpError(400, "url must not contain credentials");
  if (!isPublicHostname(u.hostname)) throw new HttpError(400, "url must point to a public website");
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) if (TRACKING_PARAMS.test(k)) u.searchParams.delete(k);
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const path = u.pathname.replace(/\/+$/, "") || "/";
  const key = `${host}${path}${u.search}`;
  return { url: u.toString(), key, domain: host };
}

/** Rejects IP literals, localhost and single-label names, so the unfurler only fetches public sites. */
export function isPublicHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h.includes(".")) return false;
  if (h.startsWith("[") || /^\d+(\.\d+){3}$/.test(h)) return false;
  if (h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
  return true;
}

export function cleanTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags = value
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .filter((t) => t.length >= 2 && t.length <= 24);
  return [...new Set(tags)].slice(0, 5);
}

export async function verifyTurnstile(c: Ctx, token: unknown): Promise<void> {
  const secret = c.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;
  if (typeof token !== "string" || !token) throw new HttpError(400, "Complete the verification challenge");
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  const ip = c.req.header("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = (await res.json()) as { success?: boolean };
  if (!data.success) throw new HttpError(400, "Verification failed, try again");
}

export function requireUser(c: Ctx): SessionUser {
  const user = c.get("user");
  if (!user) throw new HttpError(401, "Sign in with GitHub first");
  return user;
}

export function requireStaff(c: Ctx): SessionUser {
  const user = requireUser(c);
  if (!isStaff(user)) throw new HttpError(403, "Moderators only");
  return user;
}

import { Hono } from "hono";
import { HttpError, isStaff, randomId, requireUser, type AppEnv, type Ctx, type SessionUser } from "./lib";

// Uploads for community posts. Only raster images and MP4/WebM video, identified from the file's
// own bytes (never the client's Content-Type or extension), so nothing that a browser could run
// as a document (HTML, SVG, PDF) is ever stored.

const MB = 1024 * 1024;
const IMAGE_MAX = 5 * MB;
const VIDEO_MAX = 50 * MB;
const DAILY_FILES = 30;
const DAILY_BYTES = 200 * MB;

type Kind = "image" | "video";
const TYPES: { type: string; ext: string; kind: Kind; match: (b: Uint8Array) => boolean }[] = [
  { type: "image/png", ext: "png", kind: "image", match: (b) => hex(b, 0, 8) === "89504e470d0a1a0a" },
  { type: "image/jpeg", ext: "jpg", kind: "image", match: (b) => hex(b, 0, 3) === "ffd8ff" },
  { type: "image/gif", ext: "gif", kind: "image", match: (b) => ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a" },
  { type: "image/webp", ext: "webp", kind: "image", match: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP" },
  { type: "image/avif", ext: "avif", kind: "image", match: (b) => ascii(b, 4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 4)) },
  { type: "video/webm", ext: "webm", kind: "video", match: (b) => hex(b, 0, 4) === "1a45dfa3" },
  {
    type: "video/mp4",
    ext: "mp4",
    kind: "video",
    match: (b) => ascii(b, 4, 4) === "ftyp" && !["avif", "avis", "heic", "heix", "mif1"].includes(ascii(b, 8, 4)),
  },
];

function hex(b: Uint8Array, at: number, n: number): string {
  return Array.from(b.subarray(at, at + n), (x) => x.toString(16).padStart(2, "0")).join("");
}
function ascii(b: Uint8Array, at: number, n: number): string {
  return String.fromCharCode(...b.subarray(at, at + n));
}

export const MEDIA_PATH = /\/media\/(u\/\d+\/[0-9a-f]{32}\.(?:png|jpg|gif|webp|avif|mp4|webm))/g;

export const media = new Hono<AppEnv>();

// PUT /api/media with the raw file as the body.
media.put("/", async (c) => {
  const user = requireUser(c);
  const declared = Number(c.req.header("Content-Length") ?? "0");
  if (!declared) throw new HttpError(400, "Empty upload");
  if (declared > VIDEO_MAX) throw new HttpError(413, "Files can be at most 50 MB");

  const usage = await c.env.DB.prepare(
    `SELECT COUNT(*) AS files, COALESCE(SUM(size), 0) AS bytes FROM media
      WHERE user_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`,
  )
    .bind(user.id)
    .first<{ files: number; bytes: number }>();
  if (!isStaff(user) && (usage!.files >= DAILY_FILES || usage!.bytes + declared > DAILY_BYTES)) {
    throw new HttpError(429, `Upload limit reached: ${DAILY_FILES} files or 200 MB a day`);
  }

  const body = new Uint8Array(await c.req.arrayBuffer());
  const t = TYPES.find((x) => x.match(body));
  if (!t) throw new HttpError(400, "Only PNG, JPEG, GIF, WebP, AVIF images and MP4 or WebM videos are allowed");
  if (t.kind === "image" && body.byteLength > IMAGE_MAX) throw new HttpError(413, "Images can be at most 5 MB");
  if (body.byteLength > VIDEO_MAX) throw new HttpError(413, "Videos can be at most 50 MB");

  const key = `u/${user.id}/${randomId(16)}.${t.ext}`;
  await c.env.MEDIA.put(key, body, { httpMetadata: { contentType: t.type } });
  await c.env.DB.prepare(`INSERT INTO media (key, user_id, kind, content_type, size) VALUES (?, ?, ?, ?, ?)`)
    .bind(key, user.id, t.kind, t.type, body.byteLength)
    .run();
  return c.json({ url: `/media/${key}`, kind: t.kind, size: body.byteLength }, 201);
});

async function canView(c: Ctx, key: string, user: SessionUser | null): Promise<"public" | "private" | false> {
  const row = await c.env.DB.prepare(
    `SELECT m.user_id, p.status FROM media m LEFT JOIN posts p ON p.id = m.post_id WHERE m.key = ?`,
  )
    .bind(key)
    .first<{ user_id: number; status: string | null }>();
  if (!row) return false;
  if (row.status === "approved") return "public";
  if (user && (user.id === row.user_id || isStaff(user))) return "private";
  return false;
}

// GET /media/<key>: R2 with Range support so video can seek. Locked-down headers: user files can
// never execute script on this origin.
export async function serveMedia(c: Ctx): Promise<Response> {
  const key = c.req.path.replace(/^\/media\//, "");
  if (!/^u\/\d+\/[0-9a-f]{32}\.(png|jpg|gif|webp|avif|mp4|webm)$/.test(key)) return c.notFound();
  const access = await canView(c, key, c.get("user"));
  if (!access) return c.notFound();

  const range = c.req.header("Range");
  const obj = await c.env.MEDIA.get(key, range ? { range: c.req.raw.headers } : undefined);
  if (!obj) return c.notFound();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("ETag", obj.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Cache-Control", access === "public" ? "public, max-age=86400" : "private, no-store");

  if (range && obj.range && "offset" in obj.range) {
    const offset = obj.range.offset ?? 0;
    const length = obj.range.length ?? obj.size - offset;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    headers.set("Content-Length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { headers });
}

/** Points every upload a post references (and the author owns) at that post. */
export async function attachMedia(c: Ctx, postId: number, userId: number, body: string): Promise<void> {
  const keys = [...new Set([...body.matchAll(MEDIA_PATH)].map((m) => m[1]))];
  const stmts = [c.env.DB.prepare(`UPDATE media SET post_id = NULL WHERE post_id = ?`).bind(postId)];
  for (const k of keys) {
    stmts.push(c.env.DB.prepare(`UPDATE media SET post_id = ? WHERE key = ? AND user_id = ?`).bind(postId, k, userId));
  }
  await c.env.DB.batch(stmts);
}

/** R2 objects aren't covered by ON DELETE CASCADE; remove them explicitly. */
export async function deleteUserMedia(c: Ctx, userId: number): Promise<void> {
  const { results } = await c.env.DB.prepare(`SELECT key FROM media WHERE user_id = ?`).bind(userId).all<{ key: string }>();
  for (let i = 0; i < results.length; i += 1000) {
    await c.env.MEDIA.delete(results.slice(i, i + 1000).map((r) => r.key));
  }
}

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentType } from "react";

// Official blog posts are MDX files in content/blog/<slug>.mdx, each exporting
// `export const post = { title, date, summary, tags, author }`. Everything here runs at build time
// (static export), so a post with missing or malformed metadata fails `next build` instead of
// shipping a broken page.

export interface PostMeta {
  title: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  summary: string;
  tags: string[];
  author: string;
  /** Drafts render in `next dev` and are left out of production builds. */
  draft?: boolean;
}

export interface Post extends PostMeta {
  slug: string;
  readingMinutes: number;
}

const POSTS_DIR = join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;

export function tagSlug(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function validate(slug: string, meta: unknown): PostMeta {
  const m = meta as Partial<PostMeta> | undefined;
  const problems: string[] = [];
  if (!m) problems.push("missing `export const post = { ... }`");
  else {
    if (!m.title) problems.push("title");
    if (!m.date || !/^\d{4}-\d{2}-\d{2}$/.test(m.date)) problems.push("date (YYYY-MM-DD)");
    if (!m.summary) problems.push("summary");
    if (!m.author) problems.push("author");
    if (!Array.isArray(m.tags) || m.tags.length === 0) problems.push("tags (at least one)");
  }
  if (problems.length) throw new Error(`content/blog/${slug}.mdx: invalid post metadata: ${problems.join(", ")}`);
  return m as PostMeta;
}

function readingMinutes(slug: string): number {
  const source = readFileSync(join(POSTS_DIR, `${slug}.mdx`), "utf8")
    .replace(/^export const post[\s\S]*?\n};?\n/m, "")
    .replace(/^import .*$/gm, "");
  const words = source.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function allSlugs(): string[] {
  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export async function loadPost(slug: string): Promise<{ post: Post; Content: ComponentType }> {
  const mod = await import(`@/content/blog/${slug}.mdx`);
  const meta = validate(slug, mod.post);
  return { post: { ...meta, slug, readingMinutes: readingMinutes(slug) }, Content: mod.default };
}

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const includeDrafts = process.env.NODE_ENV !== "production";
  const posts = await Promise.all(allSlugs().map(async (slug) => (await loadPost(slug)).post));
  return posts
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
}

export async function getTags(): Promise<{ tag: string; slug: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const p of await getPosts()) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, slug: tagSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

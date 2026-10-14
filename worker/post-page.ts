import { isStaff, type Ctx } from "./lib";
import { escapeHtml, renderMarkdown } from "./markdown";
import { SELECT_POST, readingMinutes, type PostRow } from "./posts";

// /community/p/<slug>: the static shell from app/community/p/page.tsx (site header, footer, TOC),
// with the post rendered here and streamed into #community-post via HTMLRewriter. Search engines
// and link previews get real HTML and metadata, and no client-side Markdown renderer ships.

const SITE = "https://kandraorm.com";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function avatar(login: string, url: string | null): string {
  if (url) return `<img src="${escapeHtml(url)}&s=48" alt="" width="24" height="24" class="rounded-full bg-paper-raised">`;
  return `<span aria-hidden="true" class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-soft text-accent-strong text-xs font-semibold">${escapeHtml(login.slice(0, 1).toUpperCase())}</span>`;
}

const STATUS_NOTE: Record<string, string> = {
  draft: "Draft. Only you and moderators can see this page.",
  pending: "Waiting for a moderator. Only you and moderators can see this page.",
  rejected: "Not accepted. Only you and moderators can see this page.",
};

function postHtml(p: PostRow, isOwner: boolean): string {
  const date = p.published_at ?? p.updated_at;
  const tags = p.tags ? p.tags.split(",").sort() : [];
  const note = STATUS_NOTE[p.status];
  return `
<header class="mb-10">
  ${note ? `<p class="mb-6 rounded-[var(--radius)] bg-gotcha-soft text-gotcha px-4 py-3 text-sm font-medium" role="status">${note}${p.reject_reason ? ` Reason: ${escapeHtml(p.reject_reason)}` : ""}</p>` : ""}
  <p class="type-eyebrow mb-3"><a href="/community/posts" class="hover:underline underline-offset-4">Community posts</a></p>
  <h1 class="type-headline text-balance">${escapeHtml(p.title)}</h1>
  <p class="type-lede mt-4 text-pretty">${escapeHtml(p.summary)}</p>
  <div class="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
    <a href="https://github.com/${escapeHtml(p.login)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-ink font-medium hover:underline">${avatar(p.login, p.avatar_url)}${escapeHtml(p.name || p.login)}</a>
    <span aria-hidden="true" class="text-ink-faint">&middot;</span>
    <time datetime="${escapeHtml(date)}">${formatDate(date)}</time>
    <span aria-hidden="true" class="text-ink-faint">&middot;</span>
    <span>${readingMinutes(p.body_md)} min read</span>
    ${isOwner ? `<a href="/community/write?id=${p.id}" class="ml-auto text-accent-strong hover:underline underline-offset-4">Edit</a>` : ""}
  </div>
  ${p.canonical_url ? `<p class="mt-3 text-sm text-ink-muted">Originally published at <a href="${escapeHtml(p.canonical_url)}" rel="nofollow ugc noopener noreferrer" target="_blank" class="underline">${escapeHtml(new URL(p.canonical_url).hostname)}</a>.</p>` : ""}
</header>
<article class="kandra-prose post-body">${renderMarkdown(p.body_md)}</article>
<footer class="mt-14 pt-8 border-t border-border">
  <div class="flex flex-wrap gap-2">${tags.map((t) => `<a class="chip" href="/community/posts?tag=${encodeURIComponent(t)}">#${escapeHtml(t)}</a>`).join("")}</div>
  <p class="mt-8 text-sm text-ink-muted">Written by a community member and reviewed by a moderator. <a href="/community/write" class="text-accent-strong hover:underline underline-offset-4">Write a post &rsaquo;</a></p>
</footer>`;
}

export async function renderPostPage(c: Ctx): Promise<Response> {
  const slug = c.req.param("slug") ?? "";
  const notFound = async () => {
    const page = await c.env.ASSETS.fetch(new Request(new URL("/404", c.req.url)));
    return new Response(page.body, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  };
  if (!/^[a-z0-9-]{1,80}-\d+$/.test(slug)) return notFound();

  const p = await c.env.DB.prepare(`${SELECT_POST} WHERE p.slug = ? AND u.banned = 0`).bind(slug).first<PostRow>();
  const user = c.get("user");
  const isOwner = !!p && !!user && (user.id === p.user_id || isStaff(user));
  if (!p || (p.status !== "approved" && !isOwner)) return notFound();

  const shell = await c.env.ASSETS.fetch(new Request(new URL("/community/p", c.req.url)));
  const url = `${SITE}/community/p/${p.slug}`;
  const title = `${p.title} — Kandra`;
  const head = [
    `<link rel="canonical" href="${escapeHtml(p.canonical_url ?? url)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeHtml(p.title)}">`,
    `<meta property="og:description" content="${escapeHtml(p.summary)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="article:author" content="https://github.com/${escapeHtml(p.login)}">`,
    p.published_at ? `<meta property="article:published_time" content="${escapeHtml(p.published_at)}">` : "",
    p.status === "approved" ? "" : `<meta name="robots" content="noindex">`,
  ].join("");

  const res = new HTMLRewriter()
    .on("title", { element: (el) => void el.setInnerContent(title) })
    .on('meta[name="description"]', { element: (el) => void el.setAttribute("content", p.summary) })
    .on('meta[name="robots"]', { element: (el) => void el.remove() })
    .on("head", { element: (el) => void el.append(head, { html: true }) })
    .on("#community-post", { element: (el) => void el.setInnerContent(postHtml(p, isOwner), { html: true }) })
    .transform(shell);

  const headers = new Headers(res.headers);
  headers.set("Cache-Control", p.status === "approved" && !user ? "public, max-age=60" : "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(res.body, { status: 200, headers });
}

# Kandra docs

The documentation site for [Kandra](https://github.com/Dev-Pasaka/kandra), a Kotlin-first ORM for
ScyllaDB/Cassandra shipped as a Ktor plugin. Next.js (App Router) + MDX, statically exported —
no backend, no required paid services.

This is a separate codebase from Kandra itself. It consumes Kandra's source and docs as raw
material for content but ships independently.

## Stack

- Next.js 16 (App Router, Turbopack, static export)
- MDX (`@next/mdx`) for content, with a small custom component set (`Callout`, `Tabs`,
  `SideBySide`, `VersionNote`) available in every page without an explicit import
- Tailwind CSS v4, hand-rolled design tokens (no UI kit) — see `app/globals.css`
- Shiki (via `rehype-pretty-code`) for syntax highlighting, dual light/dark theme
- Pagefind for fully static full-text search (built post-`next build`, no external service)
- Radix UI primitives for the search palette, mobile nav, and tabs

## Development

```bash
npm install
npm run dev
```

Search (Cmd/Ctrl+K) only works after a full build — `pagefind` indexes the exported `out/`
directory, which doesn't exist in dev mode. The search palette shows an explicit "not available in
dev mode" message rather than failing silently.

## Build

```bash
npm run build
```

Runs `next build` (static export to `out/`) followed by `pagefind` indexing as a `postbuild` step.

## Content

Every route lives at `app/(docs)/<route>/page.mdx`, mirroring the URL 1:1 (the `(docs)` segment is
a route group and doesn't appear in the URL). Non-content routes (the homepage, the reference
index) may be `page.tsx` where a custom layout is needed.

Version pins and external links (Kandra's current documented version, the Dokka base URL, this
repo's own URL for "Edit this page" links) live in one place: `lib/site-config.ts`.

## Checks

```bash
npm run check-stale-api      # sweeps content for known-stale API patterns (pre-rename DSL/batch scope)
npm run check-kandra-version # warns if the pinned Kandra version lags the latest upstream tag
```

There is no CI in this repo, so run both before pushing to `main`. `check-kandra-version` depends on
upstream state (the latest Kandra tag), not just this repo's own changes, so it's also worth running
whenever Kandra cuts a release.

## Blog

Official posts are `content/blog/<slug>.mdx` files that start with
`export const post = { title, date: "YYYY-MM-DD", summary, tags: [...], author }`. Add
`draft: true` to keep a post out of production builds. Missing metadata fails `next build`. Posts
get `/blog/<slug>`, tag pages, the RSS feed at `/blog/rss.xml` and sitemap entries automatically.

## Community API (Worker + D1)

`/community` (links to people's own writing) and `/resources` (libraries, samples, tools) are
static pages that call a small JSON API in `worker/` (Hono on Cloudflare Workers, SQLite via D1,
schema in `migrations/`). Only `/api/*` runs the Worker; every other path is served from `out/`.

- **Sign-in:** GitHub OAuth, public profile only, with an opaque session id in an HttpOnly cookie.
- **Moderation:** new submissions are pending until a moderator approves them at `/admin`. After
  three approved submissions, a member's new ones publish immediately. GitHub logins in
  `ADMIN_GITHUB_LOGINS` get the admin role.
- **Abuse limits:** same-origin check on every write, 5 submissions a day per member, duplicate-URL
  detection, `nofollow ugc` links, reports, bans, and optional Turnstile.

Local development (`next dev` has no Worker, so the community pages need this):

```bash
cp .dev.vars.example .dev.vars      # DEV_LOGIN=1 enables /api/auth/dev-login on localhost
npm run db:migrate:local
npm run preview                      # build + wrangler dev on http://localhost:8787
# sign in as anyone: http://localhost:8787/api/auth/dev-login?login=alice&next=/community
```

One-time production setup:

1. `npx wrangler login`, then `npx wrangler d1 create kandra-site` and put the returned
   `database_id` in `wrangler.jsonc`.
2. `npm run db:migrate:remote`.
3. Create a GitHub OAuth app (github.com/settings/developers) with callback URL
   `https://kandraorm.com/api/auth/callback`. Put its client id in
   `wrangler.jsonc` `vars.GITHUB_CLIENT_ID` and run `npx wrangler secret put GITHUB_CLIENT_SECRET`.
4. Optional: create a Turnstile widget, set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as a build variable
   in the Cloudflare dashboard, and run `npx wrangler secret put TURNSTILE_SECRET_KEY`.

When you add a migration, run `npm run db:migrate:remote` before (or right after) the deploy
that needs it.

## Deployment

Cloudflare owns build and deploy: this repo is connected to a Cloudflare Workers project via its
own Git integration (Workers Builds), which runs on every push to `main` independently of GitHub —
`wrangler.jsonc` (static assets from `out/` plus the `/api` Worker in `worker/`) and a
`wrangler deploy` deploy command configured in the Cloudflare dashboard is the whole pipeline.
Nothing here triggers that deploy.

There are no GitHub Actions workflows: Cloudflare's build is the only pipeline, so a build error
surfaces there. The docs and blog are fully static; only the community pages depend on the Worker.

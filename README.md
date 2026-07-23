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

Both run in CI (`.github/workflows/`); `check-kandra-version` runs on a weekly schedule since it
depends on upstream state, not just this repo's own changes.

## Deployment

Cloudflare owns build and deploy: this repo is connected to a Cloudflare Workers project via its
own Git integration (Workers Builds), which runs on every push to `main` independently of GitHub —
`wrangler.jsonc` (a static-assets Worker, no `main` script) plus a `wrangler deploy` deploy command
configured in the Cloudflare dashboard is the whole pipeline. Nothing here triggers that deploy.

`.github/workflows/deploy.yml` is validation only — `check-stale-api` + `next build` on every push
and PR, to catch content/build errors before Cloudflare ever sees them. It doesn't deploy anything.
The site has no backend, so it would deploy equally well to Vercel, Netlify, or any static host if
that ever changes.

// Single source of truth for version pins and external links.
// Update KANDRA_VERSION when re-verifying content against a newer Kandra tag.

export const KANDRA_VERSION = "0.4.6";

// The Kandra library repo (source of truth for behavior/claims on this site).
export const KANDRA_REPO_URL = "https://github.com/Dev-Pasaka/kandra";

// This documentation site's own repo, for "Edit this page" links.
export const SITE_REPO_URL = "https://github.com/Dev-Pasaka/Kandra-Site";

// Dokka publishes at this base. Verified live on 2026-07-23: the site redirects
// "/" to the latest *published* version directory, which is v0.4.6 — caught up
// with KANDRA_VERSION, no gap right now (confirmed GeneratedUuid's own Dokka page
// is live). This won't stay true forever: Dokka publishing is a separate step
// from tagging a release, so re-check this against the live site whenever
// KANDRA_VERSION moves. Module reference pages surface the gap explicitly
// instead of silently linking to docs for behavior that may have changed,
// whenever DOKKA_PUBLISHED_VERSION does fall behind again.
export const DOKKA_BASE_URL = "https://dev-pasaka.github.io/kandra";
export const DOKKA_PUBLISHED_VERSION = "0.4.6";

export const KANDRA_MODULES = [
  "kandra-bom",
  "kandra-core",
  "kandra-runtime",
  "kandra-ktor",
  "kandra-koin",
  "kandra-kodein",
  "kandra-codegen",
  "kandra-test",
  "kandra-multidc",
  "kandra-migrate",
  "kandra-jakarta",
] as const;

export type KandraModule = (typeof KANDRA_MODULES)[number];

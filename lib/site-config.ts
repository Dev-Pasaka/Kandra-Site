// Single source of truth for version pins and external links.
// Update KANDRA_VERSION when re-verifying content against a newer Kandra tag.

export const KANDRA_VERSION = "0.5.2";

// The Kandra library repo (source of truth for behavior/claims on this site).
export const KANDRA_REPO_URL = "https://github.com/Dev-Pasaka/kandra";

// The official domain (served by the kandra-site Cloudflare Worker). Used for absolute URLs: sitemap, robots, RSS,
// canonical/Open Graph tags.
export const SITE_URL = "https://kandraorm.com";

// This documentation site's own repo, for "Edit this page" links.
export const SITE_REPO_URL = "https://github.com/Dev-Pasaka/Kandra-Site";

// Dokka publishes at this base. Checked live on 2026-10-20: "/" redirects to v0.5.0, matching
// KANDRA_VERSION. Dokka publishing is a separate step from tagging a release, so this can lag
// again; re-check the live site on each release and bump it when Dokka catches up. Module
// reference pages surface any gap explicitly instead of silently linking to stale docs.
export const DOKKA_BASE_URL = "https://dev-pasaka.github.io/kandra";
export const DOKKA_PUBLISHED_VERSION = "0.5.2";

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

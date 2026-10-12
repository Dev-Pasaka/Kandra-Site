// Single source of truth for version pins and external links.
// Update KANDRA_VERSION when re-verifying content against a newer Kandra tag.

export const KANDRA_VERSION = "0.4.7";

// The Kandra library repo (source of truth for behavior/claims on this site).
export const KANDRA_REPO_URL = "https://github.com/Dev-Pasaka/kandra";

// This documentation site's own repo, for "Edit this page" links.
export const SITE_REPO_URL = "https://github.com/Dev-Pasaka/Kandra-Site";

// Dokka publishes at this base. Checked live on 2026-10-12, the day v0.4.7 was tagged: the site
// still redirects "/" to v0.4.6, so Dokka is one release behind KANDRA_VERSION. Dokka publishing is
// a separate step from tagging a release; re-check the live site and bump this when it catches up.
// Module reference pages surface the gap explicitly instead of silently linking to docs for
// behavior that may have changed.
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

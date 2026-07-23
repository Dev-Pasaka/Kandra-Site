// Single source of truth for version pins and external links.
// Update KANDRA_VERSION when re-verifying content against a newer Kandra tag.

export const KANDRA_VERSION = "0.4.5";

// The Kandra library repo (source of truth for behavior/claims on this site).
export const KANDRA_REPO_URL = "https://github.com/Dev-Pasaka/kandra";

// This documentation site's own repo, for "Edit this page" links.
// Update once the site is pushed to its permanent home.
export const SITE_REPO_URL = "https://github.com/Dev-Pasaka/kandra-docs";
export const SITE_REPO_CONTENT_PATH = "content"; // where MDX source lives, relative to repo root

// Dokka publishes at this base. Verified live on 2026-07-22: the site redirects
// "/" to the latest *published* version directory, which currently lags behind
// the library's actual latest tag (published: v0.4.3, source: v0.4.5 — the Kandra
// repo was re-tagged from 0.4.4 to 0.4.5 mid-session; the 0.4.5 release note is
// "query DSL breaking fix + doc corrections," consistent with facts already
// verified here: no unary-plus DSL, no allowFiltering()). Module reference pages
// surface the Dokka gap explicitly instead of silently linking to docs for
// behavior that may have changed.
export const DOKKA_BASE_URL = "https://dev-pasaka.github.io/kandra";
export const DOKKA_PUBLISHED_VERSION = "0.4.3";

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

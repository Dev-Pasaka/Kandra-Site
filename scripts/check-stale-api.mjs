#!/usr/bin/env node
// Sweeps all MDX content for known-stale Kandra API patterns that predate the
// currently-documented version — e.g. the removed `+`-prefixed query DSL, or
// KandraBatchScope's pre-rename `save`/`delete` methods. Run in CI on every
// change so documentation drift is caught, not silently shipped.

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CONTENT_DIR = join(ROOT, "app", "(docs)");

const STALE_PATTERNS = [
  {
    name: "unary-plus query DSL",
    regex: /[(=\s]\+[A-Za-z][\w.]*\.(eq|isIn|gt|lt|gte|lte)\(/,
    message:
      "Found what looks like the removed `+`-prefixed query DSL (e.g. `+UserTable.email.eq(...)`). " +
      "Current syntax has no unary plus: `UserTable.email eq \"x\"`.",
    // /changelog quotes this exact removed syntax verbatim as the "before" half of documenting
    // the breaking change itself (0.4.5's entry) — that's the page's job, not a live mistake.
    excludeFiles: ["app/(docs)/changelog/page.mdx"],
  },
  {
    name: "pre-rename KandraBatchScope.save/delete",
    regex: /\b(saveIfNotExists|save|delete)\s*\(/,
    // Only flag this pattern when it appears inside an obvious batch-scope block, to avoid
    // false positives on ordinary repository .save()/.delete() calls outside a batch.
    contextRegex: /\.(batch|batchBlocking)\s*\{[^}]*\b(save|delete|saveIfNotExists)\s*\(/s,
    message:
      "Found a bare save(/delete(/saveIfNotExists( call inside what looks like a batch scope block. " +
      "KandraBatchScope's methods are saveInBatch/deleteInBatch/saveIfNotExistsInBatch, not the bare names " +
      "(Kotlin resolves a same-named repository member over the batch scope's extension).",
    // These three pages are *about* the pre-rename bug — a battle-scars retrospective, the
    // changelog's original (pre-0.4.3) release entry, and a capstone recipe's "here's the bug
    // this broke" aside — and each one legitimately quotes the old, broken save()/delete() shape
    // as a labeled historical example, always annotated as fixed/renamed right next to it. Not a
    // live mistake to fix; excluding them here is what keeps this check meaningful for every page
    // that isn't inherently about this exact history.
    excludeFiles: [
      "app/(docs)/battle-scars/batch-scope-shadowing/page.mdx",
      "app/(docs)/changelog/page.mdx",
      "app/(docs)/recipes/social-feed-capstone/page.mdx",
    ],
  },
  {
    name: "hand-hardcoded dependency version",
    regex: /ke\.co\.coinx\.kandra:[\w-]+:\d+\.\d+\.\d+/,
    message:
      "Found a literal version number on a ke.co.coinx.kandra:* dependency coordinate. Dependency " +
      "snippets should use the __KANDRA_VERSION__ placeholder (substituted at build time from " +
      "lib/site-config.ts by lib/remark-kandra-version.mjs), not a hand-typed version string.",
  },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

async function main() {
  const files = await walk(CONTENT_DIR);
  let findings = 0;

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const rel = relative(ROOT, file);

    for (const pattern of STALE_PATTERNS) {
      if (pattern.excludeFiles?.includes(rel)) continue;

      if (pattern.contextRegex) {
        if (pattern.contextRegex.test(text)) {
          console.error(`\n✗ ${rel}\n  [${pattern.name}] ${pattern.message}`);
          findings++;
        }
        continue;
      }
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (pattern.regex.test(line)) {
          console.error(`\n✗ ${rel}:${i + 1}\n  [${pattern.name}] ${pattern.message}\n  > ${line.trim()}`);
          findings++;
        }
      });
    }
  }

  if (findings > 0) {
    console.error(`\n${findings} known-stale-pattern match(es) found across ${files.length} content files.`);
    process.exit(1);
  }
  console.log(`No known-stale API patterns found across ${files.length} content files.`);
}

main();

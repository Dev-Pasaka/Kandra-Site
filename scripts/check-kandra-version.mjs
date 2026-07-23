#!/usr/bin/env node
// Compares the Kandra version this site is pinned to (lib/site-config.ts) against the latest
// tag in the Kandra repo itself, so documentation staleness is visible (a CI warning) rather
// than silent. Intentionally does not fail the build — a lagging site is still a valid,
// truthfully-versioned site; this is a nudge, not a gate.

import { readFile } from "node:fs/promises";

const CONFIG_PATH = new URL("../lib/site-config.ts", import.meta.url);

async function pinnedVersion() {
  const text = await readFile(CONFIG_PATH, "utf8");
  const match = text.match(/KANDRA_VERSION\s*=\s*"([^"]+)"/);
  if (!match) throw new Error("Could not find KANDRA_VERSION in lib/site-config.ts");
  return match[1];
}

async function latestTag() {
  const res = await fetch("https://api.github.com/repos/Dev-Pasaka/kandra/tags", {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API request failed: ${res.status}`);
  const tags = await res.json();
  if (!Array.isArray(tags) || tags.length === 0) return null;
  return tags[0].name.replace(/^v/, "");
}

async function main() {
  const pinned = await pinnedVersion();
  let latest;
  try {
    latest = await latestTag();
  } catch (err) {
    console.warn(`Could not check latest Kandra tag (${err.message}); skipping staleness check.`);
    return;
  }

  if (!latest) {
    console.warn("No tags found on Dev-Pasaka/kandra; skipping staleness check.");
    return;
  }

  if (latest !== pinned) {
    console.warn(
      `\n⚠ This site is pinned to Kandra v${pinned}, but the latest tag in the Kandra repo is v${latest}.\n` +
        `  Content should be re-verified against v${latest} source before bumping KANDRA_VERSION in lib/site-config.ts.\n`,
    );
  } else {
    console.log(`Site is pinned to v${pinned}, matching the latest Kandra tag.`);
  }
}

main();

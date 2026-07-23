#!/usr/bin/env node
// Scans all MDX/TSX content for internal links (href="/...", Link href="/...",
// markdown [text](/...)) and verifies a matching route actually exists under
// app/(docs) or app/. Catches an agent linking to a plausible-but-nonexistent slug.

import { readdir, readFile, access } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const APP_DIR = join(ROOT, "app");
const DOCS_DIR = join(APP_DIR, "(docs)");

const LINK_REGEXES = [
  /href="(\/[^"#?]*)/g,
  /href=\{`(\/[^`#?]*)/g,
  /\]\((\/[^)#?\s]*)\)/g,
];

const KNOWN_STATIC_ROUTES = new Set(["/", "/reference", "/modules", "/recipes", "/philosophy", "/battle-scars", "/tutorial"]);

async function walk(dir, exts) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full, exts)));
    else if (exts.some((e) => entry.name.endsWith(e))) files.push(full);
  }
  return files;
}

async function routeExists(route) {
  if (route === "/") return true;
  if (KNOWN_STATIC_ROUTES.has(route)) {
    const dir = route === "/" ? DOCS_DIR : join(DOCS_DIR, route);
    try {
      await access(join(dir, "page.mdx"));
      return true;
    } catch {
      try {
        await access(join(dir, "page.tsx"));
        return true;
      } catch {
        return false;
      }
    }
  }
  const dir = join(DOCS_DIR, route);
  for (const candidate of ["page.mdx", "page.tsx"]) {
    try {
      await access(join(dir, candidate));
      return true;
    } catch {
      /* keep checking */
    }
  }
  return false;
}

async function main() {
  const files = await walk(APP_DIR, [".mdx", ".tsx"]);
  const found = new Map(); // route -> [{file, }]

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const rel = relative(ROOT, file);
    for (const regex of LINK_REGEXES) {
      let m;
      const re = new RegExp(regex);
      while ((m = re.exec(text))) {
        let route = m[1];
        if (!route || route.startsWith("//")) continue;
        // A template-literal href like `/modules/${m}` embeds a JS variable this static scan
        // can't evaluate — skip it rather than checking the literal placeholder text as a route.
        if (route.includes("${")) continue;
        route = route.replace(/\/$/, "") || "/";
        if (!found.has(route)) found.set(route, []);
        found.get(route).push(rel);
      }
    }
  }

  let broken = 0;
  const routes = Array.from(found.keys()).sort();
  for (const route of routes) {
    const exists = await routeExists(route);
    if (!exists) {
      broken++;
      console.error(`\n✗ ${route}`);
      for (const f of [...new Set(found.get(route))]) console.error(`  linked from ${f}`);
    }
  }

  console.log(`\nChecked ${routes.length} unique internal link targets across ${files.length} files.`);
  if (broken > 0) {
    console.error(`${broken} broken internal link target(s).`);
    process.exit(1);
  }
  console.log("All internal links resolve to an existing page.");
}

main();

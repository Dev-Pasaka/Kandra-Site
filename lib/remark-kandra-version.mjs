// Remark plugin: replaces the __KANDRA_VERSION__ placeholder inside fenced code blocks
// with the real Kandra version, read directly from lib/site-config.ts (regex, not a TS
// import, since this file must run as plain ESM inside the MDX/remark pipeline).
//
// This is what actually keeps dependency-coordinate snippets (build.gradle.kts, pom.xml)
// truthful without hand-editing every code block on every version bump: write
// "kandra-bom:__KANDRA_VERSION__" in the .mdx source, and this plugin swaps in the real
// version at build time, straight from the single source of truth.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = fileURLToPath(new URL("./site-config.ts", import.meta.url));
const PLACEHOLDER = "__KANDRA_VERSION__";

function readKandraVersion() {
  const text = readFileSync(CONFIG_PATH, "utf8");
  const match = text.match(/KANDRA_VERSION\s*=\s*"([^"]+)"/);
  if (!match) throw new Error("Could not find KANDRA_VERSION in lib/site-config.ts");
  return match[1];
}

export default function remarkKandraVersion() {
  const version = readKandraVersion();
  return (tree) => {
    visit(tree, "code", (node) => {
      if (node.value && node.value.includes(PLACEHOLDER)) {
        node.value = node.value.split(PLACEHOLDER).join(version);
      }
    });
  };
}

function visit(tree, type, visitor) {
  if (tree.type === type) visitor(tree);
  if (Array.isArray(tree.children)) {
    for (const child of tree.children) visit(child, type, visitor);
  }
}

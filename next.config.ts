import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// @next/mdx resolves string plugin entries via `require.resolve(entry, { paths: [projectRoot] })`,
// which only resolves relative specifiers ("./lib/x.mjs") against the *loader's* own location,
// not the project root — so a plain relative path fails under both Turbopack and webpack. An
// absolute path is still a plain, JSON-serializable string, so it works under Turbopack too.
const remarkKandraVersionPath = fileURLToPath(new URL("./lib/remark-kandra-version.mjs", import.meta.url));

// Turbopack (Next 16's default builder) requires remark/rehype plugins to be
// referenced by string name with JSON-serializable options — passing an
// imported function reference only works under the (now opt-in) webpack
// builder. None of these plugins need function-valued options, so the
// string form works and keeps us on Turbopack.
const prettyCodeOptions = {
  theme: {
    light: "vitesse-light",
    dark: "vitesse-dark",
  },
  keepBackground: false,
  defaultLang: "plaintext",
};

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    unoptimized: true,
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ["remark-gfm", remarkKandraVersionPath],
    rehypePlugins: [
      ["rehype-pretty-code", prettyCodeOptions],
      "rehype-slug",
      [
        "rehype-autolink-headings",
        {
          behavior: "wrap",
          properties: { className: ["heading-anchor"] },
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);

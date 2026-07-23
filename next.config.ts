import type { NextConfig } from "next";
import createMDX from "@next/mdx";

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
    remarkPlugins: ["remark-gfm"],
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

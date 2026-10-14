import MarkdownIt from "markdown-it";

// Community posts are untrusted Markdown. markdown-it with `html: false` escapes any raw HTML and
// its link validator drops javascript:/data: URLs. On top of that:
// - images render only from this site's own uploads (/media/...), so posts can't embed tracking
//   pixels or hotlinked content; ![alt](/media/....mp4|webm) becomes a <video> player;
// - every link is nofollow ugc and external ones open in a new tab;
// - headings get ids for the table of contents.

const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false });

const OWN_MEDIA = /^\/media\/u\/\d+\/[0-9a-f]{32}\.(png|jpg|gif|webp|avif|mp4|webm)$/;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "section";
}

// A paragraph holding nothing but one image/video renders as a bare <figure>; <figure> isn't
// allowed inside <p>, and browsers would split the paragraph around it.
md.core.ruler.push("unwrap_media", (state) => {
  const t = state.tokens;
  for (let i = 0; i + 2 < t.length; i++) {
    const kids = t[i + 1].children?.filter((k) => !(k.type === "text" && !k.content.trim()) && k.type !== "softbreak");
    if (t[i].type === "paragraph_open" && t[i + 2].type === "paragraph_close" && kids?.length === 1 && kids[0].type === "image") {
      t[i].hidden = true;
      t[i + 2].hidden = true;
    }
  }
});

md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx];
  const src = token.attrGet("src") ?? "";
  const alt = md.utils.escapeHtml(token.content);
  const title = token.attrGet("title");
  if (!OWN_MEDIA.test(src)) return alt ? `<span class="text-ink-muted">[image: ${alt}]</span>` : "";
  const caption = title ? `<figcaption>${md.utils.escapeHtml(title)}</figcaption>` : "";
  if (/\.(mp4|webm)$/.test(src)) {
    return `<figure class="post-media"><video src="${src}" controls playsinline preload="metadata" aria-label="${alt}"></video>${caption}</figure>`;
  }
  return `<figure class="post-media"><img src="${src}" alt="${alt}" loading="lazy" decoding="async">${caption}</figure>`;
};

const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts));
md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
  const t = tokens[idx];
  const href = t.attrGet("href") ?? "";
  const external = !href.startsWith("/") && !href.startsWith("#");
  t.attrSet("rel", external ? "nofollow ugc noopener noreferrer" : "nofollow ugc");
  if (external) t.attrSet("target", "_blank");
  return defaultLinkOpen(tokens, idx, opts, env, self);
};

md.renderer.rules.heading_open = (tokens, idx, opts, env, self) => {
  const seen: Map<string, number> = (env.ids ??= new Map());
  const text = tokens[idx + 1]?.content ?? "";
  let id = slugify(text);
  const n = seen.get(id) ?? 0;
  seen.set(id, n + 1);
  if (n) id = `${id}-${n}`;
  tokens[idx].attrSet("id", id);
  return self.renderToken(tokens, idx, opts);
};

// Wide tables scroll inside their own box on phones.
md.renderer.rules.table_open = () => `<div class="post-table"><table>`;
md.renderer.rules.table_close = () => `</table></div>`;

export function renderMarkdown(source: string): string {
  return md.render(source, {});
}

export function escapeHtml(s: string): string {
  return md.utils.escapeHtml(s);
}

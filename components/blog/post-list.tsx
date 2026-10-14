import Link from "next/link";
import { formatPostDate, tagSlug, type Post } from "@/lib/blog";

export function TagChip({ tag, active = false }: { tag: string; active?: boolean }) {
  return (
    <Link
      href={`/blog/tags/${tagSlug(tag)}`}
      aria-current={active ? "page" : undefined}
      className={`pressable inline-flex items-center rounded-full px-3 py-1 text-[0.8rem] transition-colors ${
        active ? "bg-ink text-paper" : "bg-paper-raised text-ink-muted hover:text-ink"
      }`}
    >
      {tag}
    </Link>
  );
}

export function PostMetaLine({ post }: { post: Post }) {
  return (
    <p className="text-sm text-ink-muted">
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
      <span aria-hidden="true" className="mx-2 text-ink-faint">&middot;</span>
      {post.readingMinutes} min read
      {post.draft && <span className="ml-2 rounded-full bg-gotcha-soft px-2 py-0.5 text-xs font-semibold text-gotcha">Draft</span>}
    </p>
  );
}

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return <p className="text-ink-muted">No posts yet.</p>;
  return (
    <ul className="divide-y divide-border border-y border-border">
      {posts.map((p) => (
        <li key={p.slug}>
          <Link href={`/blog/${p.slug}`} className="group block py-8 md:py-10">
            <PostMetaLine post={p} />
            <h2 className="type-title mt-2 group-hover:text-accent-strong transition-colors text-balance">{p.title}</h2>
            <p className="mt-2 text-ink-muted leading-relaxed text-pretty max-w-2xl">{p.summary}</p>
            <span className="mt-3 inline-block text-sm text-accent-strong group-hover:underline underline-offset-4">
              Read more &rsaquo;
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

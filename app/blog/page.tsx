import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { getPosts, getTags } from "@/lib/blog";
import { PostList, TagChip } from "@/components/blog/post-list";

export const metadata: Metadata = {
  title: "Blog",
  description: "Release notes with the reasoning behind them, design deep dives, and lessons from running Kandra against real clusters.",
  alternates: { types: { "application/rss+xml": "/blog/rss.xml" } },
};

export default async function BlogIndex() {
  const [posts, tags] = await Promise.all([getPosts(), getTags()]);
  return (
    <main className="mx-auto w-full max-w-[860px] px-4 md:px-6 py-16 md:py-24">
      <header className="mb-10 md:mb-14">
        <h1 className="type-hero">Blog</h1>
        <p className="type-lede mt-4 max-w-2xl text-pretty">
          Release notes with the reasoning behind them, design deep dives, and lessons from running
          Kandra against real clusters.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <TagChip key={t.slug} tag={t.tag} />
          ))}
          <a href="/blog/rss.xml" className="pressable ml-auto inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <Rss className="w-4 h-4" strokeWidth={1.9} aria-hidden="true" /> RSS
          </a>
        </div>
      </header>
      <PostList posts={posts} />
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, getTags, tagSlug } from "@/lib/blog";
import { PostList, TagChip } from "@/components/blog/post-list";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getTags()).map((t) => ({ tag: t.slug }));
}

async function resolve(slug: string) {
  const tags = await getTags();
  const tag = tags.find((t) => t.slug === slug)!;
  const posts = (await getPosts()).filter((p) => p.tags.some((t) => tagSlug(t) === slug));
  return { tags, tag, posts };
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await resolve((await params).tag);
  return { title: `${tag.tag} — Blog`, description: `Kandra blog posts tagged ${tag.tag}.` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tags, tag, posts } = await resolve((await params).tag);
  return (
    <main className="mx-auto w-full max-w-[860px] px-4 md:px-6 py-16 md:py-24">
      <header className="mb-10 md:mb-14">
        <p className="type-eyebrow mb-3">
          <Link href="/blog" className="hover:underline underline-offset-4">Blog</Link>
        </p>
        <h1 className="type-headline">{tag.tag}</h1>
        <p className="mt-3 text-ink-muted">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((t) => (
            <TagChip key={t.slug} tag={t.tag} active={t.slug === tag.slug} />
          ))}
        </div>
      </header>
      <PostList posts={posts} />
    </main>
  );
}

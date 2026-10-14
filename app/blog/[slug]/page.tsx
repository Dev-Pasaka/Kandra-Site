import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, loadPost } from "@/lib/blog";
import { PostMetaLine, TagChip } from "@/components/blog/post-list";
import { Toc } from "@/components/toc";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { post } = await loadPost((await params).slug);
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ post, Content }, posts] = await Promise.all([loadPost(slug), getPosts()]);
  const i = posts.findIndex((p) => p.slug === slug);
  const newer = i > 0 ? posts[i - 1] : undefined;
  const older = i >= 0 && i < posts.length - 1 ? posts[i + 1] : undefined;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_200px] gap-12">
      <main className="py-14 md:py-20 min-w-0 max-w-[720px] w-full mx-auto xl:mx-0 xl:ml-auto">
        <header className="mb-10">
          <p className="type-eyebrow mb-3">
            <Link href="/blog" className="hover:underline underline-offset-4">Blog</Link>
          </p>
          <h1 className="type-headline text-balance">{post.title}</h1>
          <p className="type-lede mt-4 text-pretty">{post.summary}</p>
          <div className="mt-5">
            <PostMetaLine post={post} />
            <p className="mt-1 text-sm text-ink-muted">By {post.author}</p>
          </div>
        </header>

        <article className="kandra-prose">
          <Content />
        </article>

        <footer className="mt-14 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <TagChip key={t} tag={t} />
            ))}
          </div>
          {(newer || older) && (
            <nav aria-label="More posts" className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {older ? (
                <Link href={`/blog/${older.slug}`} className="card card-link p-5">
                  <span className="text-xs text-ink-muted">Older</span>
                  <span className="block mt-1 font-semibold">{older.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newer && (
                <Link href={`/blog/${newer.slug}`} className="card card-link p-5 sm:text-right">
                  <span className="text-xs text-ink-muted">Newer</span>
                  <span className="block mt-1 font-semibold">{newer.title}</span>
                </Link>
              )}
            </nav>
          )}
        </footer>
      </main>

      <aside className="hidden xl:block py-20 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
        <Toc />
      </aside>
    </div>
  );
}

import type { Metadata } from "next";
import { Toc } from "@/components/toc";
import { PostTitle } from "@/components/community/post-title";

// Shell for community posts. The Worker (worker/post-page.ts) serves /community/p/<slug> by
// streaming this page through HTMLRewriter: it sets the title and meta tags and fills
// #community-post with the rendered post. This bare path itself is never linked.
export const metadata: Metadata = {
  title: "Community post",
  robots: { index: false },
};

export default function CommunityPostShell() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_200px] gap-12">
      <main className="py-14 md:py-20 min-w-0 max-w-[720px] w-full mx-auto xl:mx-0 xl:ml-auto">
        {/* Filled by the Worker before the HTML reaches the browser; React leaves it alone on hydration. */}
        <div id="community-post" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
        <PostTitle />
      </main>
      <aside className="hidden xl:block py-20 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
        <Toc />
      </aside>
    </div>
  );
}

import { SiteSidebar } from "@/components/site-sidebar";
import { Toc } from "@/components/toc";
import { PrevNextNav } from "@/components/prev-next-nav";
import { EditPageLink } from "@/components/edit-page-link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1400px] w-full px-4 md:px-6 flex-1 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_200px] gap-8 xl:gap-12">
      <aside className="hidden lg:block py-10 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
        <SiteSidebar />
      </aside>

      <main className="py-10 min-w-0">
        <article className="kandra-prose">{children}</article>
        <PrevNextNav />
        <div className="mt-6">
          <EditPageLink />
        </div>
      </main>

      <aside className="hidden xl:block py-10 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
        <Toc />
      </aside>
    </div>
  );
}

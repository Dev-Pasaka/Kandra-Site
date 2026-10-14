import type { Metadata } from "next";
import Link from "next/link";
import { Feed } from "@/components/community/feed";
import { PageShell } from "@/components/community/page-shell";

export const metadata: Metadata = {
  title: "Community",
  description: "Articles, videos and talks by people building on Kandra, ScyllaDB and Cassandra.",
};

export default function CommunityPage() {
  return (
    <PageShell
      wide
      title="From the community"
      lede={
        <>
          Articles, videos and talks by people building on Kandra. Wrote something? Share it. For
          libraries, samples and tools, see <Link href="/resources" className="text-accent-strong hover:underline underline-offset-4">Resources</Link>.
        </>
      }
    >
      <Feed kind="link" />
    </PageShell>
  );
}

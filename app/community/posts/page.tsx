import type { Metadata } from "next";
import { PageShell } from "@/components/community/page-shell";
import { CommunityPostList } from "@/components/community/post-list";

export const metadata: Metadata = {
  title: "Community posts",
  description: "Posts written by people building on Kandra, ScyllaDB and Cassandra, reviewed by a moderator.",
};

export default function CommunityPostsPage() {
  return (
    <PageShell
      wide
      title="Community posts"
      lede="Write-ups by people building on Kandra, hosted here with images and video. Every post is reviewed by a moderator before it appears."
    >
      <CommunityPostList />
    </PageShell>
  );
}

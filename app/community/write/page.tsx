import type { Metadata } from "next";
import { PageShell } from "@/components/community/page-shell";
import { PostEditor } from "@/components/community/post-editor";

export const metadata: Metadata = {
  title: "Write a post",
  robots: { index: false },
};

export default function WritePage() {
  return (
    <PageShell wide title="Write a post">
      <PostEditor />
    </PageShell>
  );
}

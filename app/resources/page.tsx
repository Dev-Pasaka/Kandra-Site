import type { Metadata } from "next";
import { Feed } from "@/components/community/feed";
import { PageShell } from "@/components/community/page-shell";

export const metadata: Metadata = {
  title: "Resources",
  description: "Libraries, sample apps, guides, tools and templates for Kandra, shared by the community.",
};

export default function ResourcesPage() {
  return (
    <PageShell
      wide
      title="Resources"
      lede="Libraries, sample apps, guides, tools and templates for Kandra, shared by the community and checked by a moderator before they appear."
    >
      <Feed kind="resource" />
    </PageShell>
  );
}

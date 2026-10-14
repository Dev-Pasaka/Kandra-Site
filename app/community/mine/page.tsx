import type { Metadata } from "next";
import { PageShell } from "@/components/community/page-shell";
import { MySubmissions } from "@/components/community/my-submissions";

export const metadata: Metadata = {
  title: "My submissions",
  robots: { index: false },
};

export default function MinePage() {
  return (
    <PageShell title="My submissions">
      <MySubmissions />
    </PageShell>
  );
}

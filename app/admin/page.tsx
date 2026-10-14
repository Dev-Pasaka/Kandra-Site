import type { Metadata } from "next";
import { PageShell } from "@/components/community/page-shell";
import { AdminQueue } from "@/components/community/admin-queue";

export const metadata: Metadata = {
  title: "Moderation",
  robots: { index: false, follow: false },
};

// The page is a static shell; every /api/admin call checks the session's role on the server.
export default function AdminPage() {
  return (
    <PageShell wide title="Moderation">
      <AdminQueue />
    </PageShell>
  );
}

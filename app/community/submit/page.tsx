import type { Metadata } from "next";
import { PageShell } from "@/components/community/page-shell";
import { SubmitForm } from "@/components/community/submit-form";

export const metadata: Metadata = {
  title: "Share with the community",
  robots: { index: false },
};

export default function SubmitPage() {
  return (
    <PageShell title="Share with the community">
      <SubmitForm />
    </PageShell>
  );
}

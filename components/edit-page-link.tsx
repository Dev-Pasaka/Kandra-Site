"use client";

import { SquarePen } from "lucide-react";
import { usePathname } from "next/navigation";
import { SITE_REPO_URL } from "@/lib/site-config";

// MDX source mirrors the URL 1:1 under app/(docs), so the pathname maps
// directly to a source file — no per-page path prop to keep in sync.
export function EditPageLink() {
  const pathname = usePathname();
  const segment = pathname === "/" ? "" : pathname;
  const href = `${SITE_REPO_URL}/edit/main/app/(docs)${segment}/page.mdx`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-accent transition-colors"
    >
      <SquarePen className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
      Edit this page on GitHub
    </a>
  );
}

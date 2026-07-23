"use client";

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
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M11 2 14 5 6 13H3v-3l8-8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      Edit this page on GitHub
    </a>
  );
}

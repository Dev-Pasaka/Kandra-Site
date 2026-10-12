"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPrevNext } from "@/lib/nav";

export function PrevNextNav() {
  const pathname = usePathname();
  const { prev, next } = getPrevNext(pathname);
  if (!prev && !next) return null;

  return (
    <div className="not-prose mt-16 pt-6 border-t border-border grid grid-cols-2 gap-4">
      <div>
        {prev && (
          <Link href={prev.href} className="card-link group block rounded-[var(--radius-lg)] bg-paper-raised px-4 py-3.5">
            <div className="text-xs text-ink-muted mb-1">&larr; Previous</div>
            <div className="text-[0.95rem] font-medium text-accent-strong">{prev.title}</div>
          </Link>
        )}
      </div>
      <div className="text-right">
        {next && (
          <Link href={next.href} className="card-link group block rounded-[var(--radius-lg)] bg-paper-raised px-4 py-3.5">
            <div className="text-xs text-ink-muted mb-1">Next &rarr;</div>
            <div className="text-[0.95rem] font-medium text-accent-strong">{next.title}</div>
          </Link>
        )}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { KANDRA_REPO_URL, KANDRA_VERSION } from "@/lib/site-config";

// Flags behavior that has already changed on Kandra's `main` branch but isn't in a tagged release
// yet. The page around it still documents the released version (KANDRA_VERSION); this box says
// what's about to differ, with links to the GitHub issues. Remove each one once the release ships.
export function Unreleased({ issues = [], children }: { issues?: number[]; children: ReactNode }) {
  return (
    <div
      data-callout="unreleased"
      className="not-prose my-6 rounded-[var(--radius-lg)] bg-paper-raised px-5 py-4 text-[0.97rem] leading-relaxed"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 mb-1 text-[0.9rem] font-semibold text-accent-strong">
        Changing in the next release
        <span className="font-normal text-ink-muted text-[0.8rem]">
          on <code className="font-mono">main</code>, not in v{KANDRA_VERSION}
          {issues.length > 0 && (
            <>
              {" · "}
              {issues.map((n, i) => (
                <span key={n}>
                  {i > 0 && ", "}
                  <a href={`${KANDRA_REPO_URL}/issues/${n}`} target="_blank" rel="noreferrer" className="hover:underline">
                    #{n}
                  </a>
                </span>
              ))}
            </>
          )}
        </span>
      </div>
      <div className="[&>p]:m-0 [&>p+p]:mt-2 [&_a]:text-accent-strong [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:bg-paper/70 [&_code]:rounded-[var(--radius-sm)] [&_code]:px-1">
        {children}
      </div>
    </div>
  );
}

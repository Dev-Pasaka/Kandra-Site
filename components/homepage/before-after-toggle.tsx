"use client";

import { useState, type ReactNode } from "react";

export function BeforeAfterToggle({ before, after }: { before: ReactNode; after: ReactNode }) {
  const [active, setActive] = useState<"before" | "after">("after");

  return (
    <div>
      <div className="inline-flex items-center rounded-full border border-border p-0.5 mb-4">
        <button
          type="button"
          onClick={() => setActive("before")}
          aria-pressed={active === "before"}
          className={`rounded-full px-4 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer ${
            active === "before" ? "bg-danger text-accent-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          Before
        </button>
        <button
          type="button"
          onClick={() => setActive("after")}
          aria-pressed={active === "after"}
          className={`rounded-full px-4 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer ${
            active === "after" ? "bg-tip text-accent-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          After (v0.4.6)
        </button>
      </div>
      {active === "before" ? before : after}
    </div>
  );
}

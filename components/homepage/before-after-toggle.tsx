"use client";

import { useState, type ReactNode } from "react";

export function BeforeAfterToggle({ before, after }: { before: ReactNode; after: ReactNode }) {
  const [active, setActive] = useState<"before" | "after">("after");

  return (
    <div>
      <div className="segmented mb-4" role="group" aria-label="Show code from">
        <button
          type="button"
          onClick={() => setActive("before")}
          aria-pressed={active === "before"}
          className="cursor-pointer"
        >
          Before
        </button>
        <button
          type="button"
          onClick={() => setActive("after")}
          aria-pressed={active === "after"}
          className="cursor-pointer"
        >
          After
        </button>
      </div>
      {active === "before" ? before : after}
    </div>
  );
}

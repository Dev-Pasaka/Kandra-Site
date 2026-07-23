"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function Toc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const article = document.querySelector(".kandra-prose");
    if (!article) return;
    const els = Array.from(article.querySelectorAll("h2, h3")) as HTMLElement[];
    // Reads headings the MDX renderer already put in the DOM — genuinely external-system sync, not derivable state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadings(
      els.map((el) => ({
        id: el.id,
        text: el.textContent?.replace(/#$/, "") ?? "",
        level: el.tagName === "H2" ? 2 : 3,
      })),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 2) return null;

  return (
    <div className="text-sm">
      <div className="text-xs font-display font-semibold uppercase tracking-wide text-ink-faint mb-3">
        On this page
      </div>
      <ul className="space-y-2 border-l border-border">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1.5rem" : "0.9rem" }}>
            <a
              href={`#${h.id}`}
              className="block -ml-px border-l pl-3 py-0.5 transition-colors"
              style={{
                borderColor: activeId === h.id ? "var(--accent)" : "transparent",
                color: activeId === h.id ? "var(--accent-strong)" : "var(--ink-faint)",
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

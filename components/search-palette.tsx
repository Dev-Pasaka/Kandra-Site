"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PagefindData {
  url: string;
  excerpt: string;
  meta?: { title?: string };
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindData>;
}
interface PagefindApi {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
}
declare global {
  interface Window {
    pagefind?: PagefindApi;
  }
}

interface Hit {
  url: string;
  title: string;
  excerpt: string;
}

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else {
      // Resets local UI state when the dialog closes — external-system (Dialog open state) sync.
      /* eslint-disable react-hooks/set-state-in-effect */
      setQuery("");
      setResults([]);
      setActive(0);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  useEffect(() => {
    let live = true;
    async function run() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      if (!window.pagefind) {
        try {
          const pagefindUrl = "/pagefind/pagefind.js";
          window.pagefind = (await import(/* webpackIgnore: true */ pagefindUrl)) as unknown as PagefindApi;
        } catch {
          setUnavailable(true);
          return;
        }
      }
      const res = await window.pagefind.search(query);
      const hits = await Promise.all(
        res.results.slice(0, 8).map(async (r) => {
          const d = await r.data();
          return { url: d.url, title: d.meta?.title ?? d.url, excerpt: d.excerpt };
        }),
      );
      if (live) {
        setResults(hits);
        setActive(0);
      }
    }
    const t = setTimeout(run, 100);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);

  function go(url: string) {
    setOpen(false);
    router.push(url);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-border bg-paper-raised px-3 py-1.5 text-sm text-ink-faint hover:border-border-strong transition-colors cursor-pointer w-full max-w-56"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
            <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left">Search docs</span>
          <kbd className="text-[0.65rem] font-mono border border-border rounded-sm px-1 py-0.5 bg-paper">
            &#8984;K
          </kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-24 -translate-x-1/2 w-[min(90vw,640px)] z-50 rounded-lg border border-border bg-paper shadow-lg overflow-hidden"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              go(results[active].url);
            }
          }}
        >
          <Dialog.Title className="sr-only">Search documentation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search the Kandra documentation site
          </Dialog.Description>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-faint shrink-0">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
              <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules, tutorial pages, battle scars..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-faint"
            />
          </div>
          <div className="max-h-96 overflow-y-auto py-1.5">
            {unavailable && (
              <p className="px-4 py-6 text-sm text-ink-faint">
                Search index isn&apos;t available in dev mode — it&apos;s built by{" "}
                <code className="font-mono">pagefind</code> after <code className="font-mono">next build</code>.
              </p>
            )}
            {!unavailable && query && results.length === 0 && (
              <p className="px-4 py-6 text-sm text-ink-faint">No results for &ldquo;{query}&rdquo;.</p>
            )}
            {results.map((hit, i) => (
              <button
                key={hit.url}
                onClick={() => go(hit.url)}
                onMouseEnter={() => setActive(i)}
                className="w-full text-left px-4 py-2.5 cursor-pointer"
                style={{ background: i === active ? "var(--paper-raised)" : "transparent" }}
              >
                <div className="text-sm font-medium text-ink">{hit.title}</div>
                <div
                  className="text-xs text-ink-faint mt-0.5 line-clamp-1 [&_mark]:bg-accent-soft [&_mark]:text-ink [&_mark]:not-italic"
                  dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                />
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

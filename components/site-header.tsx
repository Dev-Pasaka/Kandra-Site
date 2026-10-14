"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SearchPalette } from "./search-palette";
import { SiteSidebar } from "./site-sidebar";
import { KANDRA_REPO_URL, KANDRA_VERSION } from "@/lib/site-config";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = usePathname() === "/";

  // The hairline under the bar only shows once content is actually underneath it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="chrome-bar sticky top-0 z-40" data-scrolled={scrolled}>
      <div className="mx-auto max-w-[1400px] flex items-center gap-4 px-4 md:px-6 h-14">
        <button
          type="button"
          className="pressable lg:hidden inline-flex items-center justify-center w-10 h-10 -ml-2 text-ink-muted cursor-pointer"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
        </button>

        <Link href="/" className="pressable flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, plain SVG */}
          <img src="/brand/kandra-octopus.svg" alt="" width={34} height={28} className="h-7 w-auto" />
          <span className="font-display font-semibold text-[1.05rem] tracking-[-0.01em]">Kandra</span>
        </Link>

        <div className="flex-1 flex justify-center max-w-md mx-auto hidden sm:flex">
          <SearchPalette />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="sm:hidden">
            <SearchPalette />
          </div>
          <nav className="hidden lg:flex items-center gap-5 text-sm text-ink-muted whitespace-nowrap">
            <Link href="/getting-started" className="hover:text-ink transition-colors">Docs</Link>
            <Link href="/tutorial" className="hover:text-ink transition-colors">Tutorial</Link>
            <Link href="/modules" className="hover:text-ink transition-colors">Modules</Link>
            <Link href="/battle-scars" className="hover:text-ink transition-colors">Battle scars</Link>
            <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
            <Link href="/community" className="hover:text-ink transition-colors">Community</Link>
          </nav>
          <span className="hidden lg:inline font-mono text-xs text-ink-faint">v{KANDRA_VERSION}</span>
          <a
            href={KANDRA_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Kandra on GitHub"
            className="pressable inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-muted hover:text-ink hover:bg-paper-raised transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          {isHome && (
            <Link
              href="/getting-started"
              className="btn btn-primary btn-sm hidden sm:inline-flex"
            >
              Get started
            </Link>
          )}
        </div>
      </div>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="scrim fixed inset-0 z-50 lg:hidden" />
          <Dialog.Content className="sheet-left fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] bg-paper shadow-[var(--shadow-float)] p-5 pt-[max(1.25rem,env(safe-area-inset-top))] overflow-y-auto overscroll-contain lg:hidden">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
            <div className="flex items-center justify-between mb-5">
              <span className="font-display font-semibold">Kandra docs</span>
              <Dialog.Close className="pressable inline-flex items-center justify-center w-9 h-9 -mr-2 rounded-full text-ink-muted hover:bg-paper-raised cursor-pointer" aria-label="Close navigation">
                <X className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <SiteSidebar onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}

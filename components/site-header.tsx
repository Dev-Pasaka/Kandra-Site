"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { SearchPalette } from "./search-palette";
import { ThemeToggle } from "./theme-toggle";
import { SiteSidebar } from "./site-sidebar";
import { KANDRA_REPO_URL } from "@/lib/site-config";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] flex items-center gap-4 px-4 md:px-6 h-14">
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-8 h-8 -ml-1 text-ink-muted cursor-pointer"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8" stroke="var(--accent)" strokeWidth="1.4" fill="none" />
            <circle cx="10" cy="10" r="8" stroke="var(--accent)" strokeOpacity="0.3" strokeWidth="4" strokeDasharray="0.5 5.5" strokeLinecap="round" fill="none" />
            <circle cx="10" cy="2" r="1.4" fill="var(--accent)" />
          </svg>
          <span className="font-display font-semibold text-[1.05rem] tracking-tight">Kandra</span>
        </Link>

        <div className="flex-1 flex justify-center max-w-md mx-auto hidden sm:flex">
          <SearchPalette />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="sm:hidden">
            <SearchPalette />
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm text-ink-muted">
            <Link href="/tutorial" className="hover:text-accent transition-colors">Tutorial</Link>
            <Link href="/modules" className="hover:text-accent transition-colors">Modules</Link>
            <Link href="/battle-scars" className="hover:text-accent transition-colors">Battle scars</Link>
          </nav>
          <a
            href={KANDRA_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Kandra on GitHub"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-ink-muted hover:text-accent hover:border-border-strong transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 bg-paper border-r border-border p-5 overflow-y-auto lg:hidden">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
            <div className="flex items-center justify-between mb-5">
              <span className="font-display font-semibold">Kandra docs</span>
              <Dialog.Close className="text-ink-faint cursor-pointer" aria-label="Close navigation">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </Dialog.Close>
            </div>
            <SiteSidebar onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}

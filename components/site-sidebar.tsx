"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { NAV_SECTIONS } from "@/lib/nav";

export function SiteSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="text-sm">
      {NAV_SECTIONS.map((section) => {
        const containsActive = section.items.some((i) => i.href === pathname);
        return (
          <SidebarSection
            key={section.title}
            title={section.title}
            defaultOpen={containsActive || section.items.length <= 3}
          >
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="block rounded-sm px-2 py-1 -ml-2 transition-colors"
                      style={{
                        color: isActive ? "var(--accent-strong)" : "var(--ink-muted)",
                        background: isActive ? "var(--accent-soft)" : "transparent",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SidebarSection>
        );
      })}
    </nav>
  );
}

function SidebarSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="mb-5">
      <Collapsible.Trigger className="flex w-full items-center justify-between text-xs font-display font-semibold uppercase tracking-wide text-ink-faint mb-2 cursor-pointer">
        {title}
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
        >
          <path d="M5 3l6 5-6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Collapsible.Trigger>
      <Collapsible.Content>{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}

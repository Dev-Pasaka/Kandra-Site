"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
                      aria-current={isActive ? "page" : undefined}
                      className="block rounded-md px-2.5 py-1.5 -ml-2.5 transition-colors hover:text-ink"
                      style={{
                        color: isActive ? "var(--accent-strong)" : "var(--ink-muted)",
                        background: isActive ? "var(--accent-soft)" : "transparent",
                        fontWeight: isActive ? 500 : 400,
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
      <Collapsible.Trigger className="flex w-full items-center justify-between text-[0.8rem] font-semibold text-ink mb-1.5 py-1 cursor-pointer">
        {title}
        <ChevronRight
          className="chevron w-3.5 h-3.5 text-ink-faint"
          strokeWidth={2.2}
          aria-hidden="true"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="disclosure">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}

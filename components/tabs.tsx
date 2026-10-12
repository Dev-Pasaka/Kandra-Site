"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

export function Tabs({
  items,
  defaultValue,
}: {
  items: { value: string; label: string; content: ReactNode }[];
  defaultValue?: string;
}) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue ?? items[0]?.value}
      className="not-prose my-6 rounded-[var(--radius-lg)] bg-[var(--code-bg)] overflow-hidden"
    >
      <RadixTabs.List className="flex gap-1 px-2 pt-2 overflow-x-auto no-scrollbar">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="pressable shrink-0 rounded-full px-3.5 py-1.5 text-[0.8rem] font-mono text-ink-muted hover:text-ink transition-colors data-[state=active]:text-ink data-[state=active]:bg-paper data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.12)] cursor-pointer"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="[&_.kandra-codeblock]:rounded-none [&_.kandra-codeblock]:bg-transparent">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

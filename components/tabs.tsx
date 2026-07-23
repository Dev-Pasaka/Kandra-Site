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
      className="not-prose my-6 rounded-md border border-border overflow-hidden"
    >
      <RadixTabs.List className="flex border-b border-border bg-paper-raised">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="px-4 py-2 text-sm font-mono text-ink-muted border-r border-border last:border-r-0 data-[state=active]:text-ink data-[state=active]:bg-paper cursor-pointer data-[state=active]:border-b-2 data-[state=active]:border-b-accent"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="[&_.kandra-codeblock]:border-0 [&_.kandra-codeblock]:rounded-none">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

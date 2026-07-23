import type { MDXComponents } from "mdx/types";
import { CodeFigure } from "@/components/code-figure";
import { Callout } from "@/components/callout";
import { Tabs } from "@/components/tabs";
import { SideBySide } from "@/components/side-by-side";
import { VersionNote } from "@/components/version-note";

const components: MDXComponents = {
  figure: (props) => <CodeFigure {...props} />,
  // Wide tables (module lists, consistency-level references) scroll in their own
  // container instead of pushing the page wider than the viewport on mobile.
  table: (props) => (
    <div className="not-prose my-6 overflow-x-auto rounded-md border border-border">
      <table {...props} className="my-0" />
    </div>
  ),
  Callout,
  Tabs,
  SideBySide,
  VersionNote,
};

export function useMDXComponents(otherComponents: MDXComponents): MDXComponents {
  return { ...components, ...otherComponents };
}

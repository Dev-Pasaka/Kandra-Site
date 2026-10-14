import type { ReactNode } from "react";
import Link from "next/link";

export function PageShell({
  title,
  lede,
  children,
  wide = false,
}: {
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`mx-auto w-full ${wide ? "max-w-[860px]" : "max-w-[680px]"} px-4 md:px-6 py-16 md:py-24`}>
      <header className="mb-10">
        <nav aria-label="Community" className="type-eyebrow mb-3 flex gap-4">
          <Link href="/community" className="hover:underline underline-offset-4">Community</Link>
          <Link href="/resources" className="hover:underline underline-offset-4">Resources</Link>
        </nav>
        <h1 className="type-headline text-balance">{title}</h1>
        {lede && <p className="type-lede mt-4 text-pretty">{lede}</p>}
      </header>
      {children}
    </main>
  );
}

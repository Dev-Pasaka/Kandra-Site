import Link from "next/link";
import { KANDRA_REPO_URL, KANDRA_VERSION, DOKKA_BASE_URL, DOKKA_PUBLISHED_VERSION } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-display font-semibold mb-3">Learn</div>
          <ul className="space-y-2 text-ink-muted">
            <li><Link href="/foundations" className="hover:text-accent">Foundations</Link></li>
            <li><Link href="/tutorial" className="hover:text-accent">Tutorial</Link></li>
            <li><Link href="/philosophy" className="hover:text-accent">Philosophy</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display font-semibold mb-3">Reference</div>
          <ul className="space-y-2 text-ink-muted">
            <li><Link href="/modules" className="hover:text-accent">Modules</Link></li>
            <li><Link href="/recipes" className="hover:text-accent">Recipes</Link></li>
            <li>
              <a href={`${DOKKA_BASE_URL}/v${DOKKA_PUBLISHED_VERSION}/`} target="_blank" rel="noreferrer" className="hover:text-accent">
                Dokka API reference
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-display font-semibold mb-3">Project</div>
          <ul className="space-y-2 text-ink-muted">
            <li><Link href="/battle-scars" className="hover:text-accent">Battle scars</Link></li>
            <li><Link href="/changelog" className="hover:text-accent">Changelog</Link></li>
            <li><Link href="/faq" className="hover:text-accent">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display font-semibold mb-3">Source</div>
          <ul className="space-y-2 text-ink-muted">
            <li>
              <a href={KANDRA_REPO_URL} target="_blank" rel="noreferrer" className="hover:text-accent">
                Kandra on GitHub
              </a>
            </li>
            <li className="font-mono text-xs text-ink-faint pt-1">v{KANDRA_VERSION}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-4 text-xs text-ink-faint flex flex-wrap gap-x-4 gap-y-1 justify-between">
          <span>Apache 2.0. Documentation for a library, not a pitch for one.</span>
          <span>Built with real bugs, found on a real cluster.</span>
        </div>
      </div>
    </footer>
  );
}

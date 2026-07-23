import Link from "next/link";
import { RingMotif } from "@/components/ring-motif";
import { KANDRA_VERSION, KANDRA_REPO_URL } from "@/lib/site-config";

const PAIN_POINTS = [
  {
    q: "Where did my lookup table go out of sync?",
    problem:
      "Cassandra has no joins and no foreign keys. Any “find X by Y” query that isn't servable by partition key needs a hand-maintained denormalized table — and a save() that updates the primary table but forgets (or half-fails) the lookup table leaves a user invisible by email, with nothing in the code that looks wrong.",
    fix: "@LookupIndex makes it an annotation, written atomically with the primary row, not a discipline you have to remember in every write path.",
    href: "/philosophy/denormalization",
  },
  {
    q: "Why is this DELETE eating my whole partition?",
    problem:
      "Relational muscle memory for “delete by ID” doesn't account for clustering keys. DELETE WHERE partition_key = ? on a clustering-keyed table deletes every row in that partition, not the one row you meant — a real data-loss bug, caught the hard way in Kandra's own ISS-025.",
    fix: "Kandra's delete methods require the full key shape at the type level — there's no partition-only delete on a clustering-keyed entity to reach for by accident.",
    href: "/battle-scars/clustering-keys-and-lookup-tables",
  },
  {
    q: "My ORM says it's atomic — but is it really?",
    problem:
      "Cassandra's LOGGED BATCH is the only cross-table atomicity primitive, and it's easy to write code that looks transactional (a few save() calls in a row) while it actually runs as N independent, non-atomic writes.",
    fix: "KandraBatchScope exists specifically for this — and its methods are named saveInBatch, not save, a direct scar from almost shipping an API that silently didn't provide the atomicity it promised.",
    href: "/battle-scars/batch-scope-shadowing",
  },
  {
    q: "Why does this need ALLOW FILTERING, and why is everyone telling me not to use it?",
    problem:
      "Cassandra will let you write a query that triggers a full-cluster scatter-gather scan, and it will degrade a production cluster badly under load. Most ORMs don't stop you.",
    fix: "Kandra's query DSL structurally cannot express ALLOW FILTERING at all. The failure mode is an exception at query-build time pointing at @SecondaryIndex, not “works fine in dev, pages someone at 3am.”",
    href: "/foundations",
  },
  {
    q: "Tombstones are eating my cluster and nobody told me.",
    problem:
      "Naive DELETE-heavy workloads generate tombstones that degrade read performance until compaction catches up, days later by default. Most relational-background developers have never had to think about this.",
    fix: "@SoftDelete uses a TTL, not a DELETE. And when deleteAll() would actually generate a lot of tombstones, it logs an explicit WARN with the count — before it becomes a 3am page.",
    href: "/recipes/soft-delete",
  },
  {
    q: "I need compare-and-set, but LWT is expensive — how do I not pay that cost everywhere?",
    problem:
      "Lightweight Transactions (Paxos-based) give you real compare-and-set semantics, but at a real latency cost most relational developers have never had to reason about — SQL transactions don't ask you to.",
    fix: "Plain writes are the default path. @Version and saveIfNotExists are something you opt into deliberately, visible in the entity definition — not hidden behind a @Transactional that quietly does something different per isolation level.",
    href: "/philosophy/consistency",
  },
  {
    q: "Why does my read work in dev but throw in production?",
    problem:
      "Partition-scoped design (or its absence) is invisible on a small dev dataset and catastrophic at scale.",
    fix: "Kandra's schema and query validation run at plugin install — startup — not first request. A query that can't be served without a full scan is caught before deploy, not discovered under load.",
    href: "/philosophy/schema-safety",
  },
];

export default function HomePage() {
  return (
    <div className="flex-1">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute right-[-60px] top-[-40px] w-[420px] h-[420px] text-ink opacity-[0.06] pointer-events-none hidden md:block">
          <RingMotif className="w-full h-full" />
        </div>
        <div className="relative mx-auto max-w-[1400px] px-4 md:px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <p className="font-mono text-xs text-accent-strong tracking-wide mb-4">
            {`v${KANDRA_VERSION} · Apache 2.0 · Kotlin + ScyllaDB/Cassandra`}
          </p>
          <h1 className="font-display font-semibold text-4xl md:text-5xl leading-[1.08] max-w-2xl tracking-tight">
            A Kotlin ORM that doesn&apos;t pretend Cassandra is SQL with extra steps.
          </h1>
          <p className="mt-6 max-w-xl text-ink-muted text-lg leading-relaxed">
            Kandra is a Kotlin-first ORM for ScyllaDB and Cassandra, shipped as a Ktor plugin.
            It doesn&apos;t hide partitioning, denormalization, or LWT cost behind a relational
            facade &mdash; it makes the distributed tradeoffs visible in your entity definitions,
            so the code that looks correct actually is.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/getting-started"
              className="inline-flex items-center rounded-md bg-accent text-accent-ink px-5 py-2.5 text-sm font-medium hover:bg-accent-strong transition-colors"
            >
              Get started &rarr;
            </Link>
            <Link
              href="/tutorial"
              className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-ink hover:border-border-strong transition-colors"
            >
              Read the tutorial
            </Link>
            <a
              href={KANDRA_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              View source &rarr;
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
            What it actually feels like to build on Cassandra without this
          </h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            Every one of these is a real failure mode, not a hypothetical &mdash; several are
            documented, root-caused bugs from Kandra&apos;s own development, caught against a real
            cluster. This isn&apos;t Cassandra taught by analogy to SQL: a distributed,
            partition-oriented, leaderless database needs distributed thinking, and that starts
            with naming the pain plainly.{" "}
            <Link href="/why" className="underline decoration-border-strong hover:decoration-current">
              Read the full argument &rarr;
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PAIN_POINTS.map((p) => (
            <Link
              key={p.q}
              href={p.href}
              className="group block rounded-lg border border-border p-5 hover:border-border-strong hover:bg-paper-raised/60 transition-colors"
            >
              <h3 className="font-display font-semibold text-base leading-snug mb-2.5">
                {p.q}
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">{p.problem}</p>
              <p className="text-sm leading-relaxed border-l-2 border-accent pl-3">
                {p.fix}
              </p>
              <span className="mt-3 inline-block text-xs font-mono text-accent-strong opacity-0 group-hover:opacity-100 transition-opacity">
                more &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-paper-raised/40">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-display font-semibold text-lg mb-2">Zero magic</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              No Spring, no classpath scanning, no reflection you can&apos;t trace. Ktor-native
              plugin installation, DI-native binding into Koin or Kodein at install time.
            </p>
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg mb-2">Fail fast, at startup</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Schema and query-shape errors surface when the plugin installs, not on the request
              that finally hits the code path in production.
            </p>
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg mb-2">Honest about the cost</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              LWT, batches, secondary indexes, tombstones &mdash; every expensive operation is
              something you reach for deliberately, visible in the entity or the call site, never
              hidden behind an annotation that quietly does more than it says.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

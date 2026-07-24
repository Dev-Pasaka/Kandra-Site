import Link from "next/link";
import { siKotlin, siApachecassandra, siSpringboot, siScylladb } from "simple-icons";
import { ChariotScene } from "@/components/illustrations/chariot-scene";
import { KANDRA_VERSION, KANDRA_REPO_URL } from "@/lib/site-config";
import { Tabs } from "@/components/tabs";
import { BrandLogo } from "@/components/brand-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PersonaToggle } from "@/components/homepage/persona-toggle";
import { BeforeAfterToggle } from "@/components/homepage/before-after-toggle";
import {
  LinkChainIcon,
  PartitionDeleteIcon,
  BatchAtomicIcon,
  ScanBlockedIcon,
  TombstoneIcon,
  ScaleCostIcon,
  StartupFlagIcon,
  PlugIcon,
  PackageIcon,
  LicenseIcon,
} from "@/components/icons";
import HeroCode from "@/components/homepage/hero-code.mdx";
import ShowcaseEntities from "@/components/homepage/showcase-entities.mdx";
import ShowcaseRepository from "@/components/homepage/showcase-repository.mdx";
import ShowcaseKtor from "@/components/homepage/showcase-ktor.mdx";
import BeforeDelete from "@/components/homepage/before-delete.mdx";
import AfterDelete from "@/components/homepage/after-delete.mdx";

const COMPARISON_ROWS = [
  {
    label: "Partitioning",
    raw: "Manual PreparedStatement + partition-key discipline, on you",
    spring: "Hidden behind @Id",
    kandra: "Explicit @PartitionKey + @ClusteringKey",
  },
  {
    label: "Dangerous queries",
    raw: "ALLOW FILTERING is a plain query flag — no guardrail",
    spring: "ALLOW FILTERING is one flag away",
    kandra: "Structurally absent from the predicate DSL — one logged exception (findActive())",
  },
  {
    label: "Cross-table writes",
    raw: "BatchStatement is available; atomicity discipline is on you",
    spring: "Manual, non-atomic by default",
    kandra: "@LookupIndex + logged batches, atomic by construction",
  },
  {
    label: "How it wires up",
    raw: "Manual CqlSession lifecycle, no DI",
    spring: "Classpath scanning, dynamic proxies",
    kandra: "Ktor plugin install, DI-native, traceable",
  },
];

const SEVERITY_STYLE: Record<string, string> = {
  P0: "text-danger border-danger/40",
  P1: "text-gotcha border-gotcha/40",
  P2: "text-tip border-tip/40",
};

const PAIN_POINTS = [
  {
    severity: "P0",
    q: "Where did my lookup table go out of sync?",
    problem:
      "Cassandra has no joins and no foreign keys. Any “find X by Y” query that isn't servable by partition key needs a hand-maintained denormalized table — and a save() that updates the primary table but forgets (or half-fails) the lookup table leaves a user invisible by email, with nothing in the code that looks wrong.",
    fix: "@LookupIndex makes it an annotation, written atomically with the primary row, not a discipline you have to remember in every write path.",
    href: "/philosophy/denormalization",
    icon: LinkChainIcon,
  },
  {
    severity: "P0",
    q: "Why is this DELETE eating my whole partition?",
    problem:
      "Relational muscle memory for “delete by ID” doesn't account for clustering keys. DELETE WHERE partition_key = ? on a clustering-keyed table deletes every row in that partition, not the one row you meant — a real data-loss bug, caught the hard way in Kandra's own ISS-025.",
    fix: "deleteById/findById take the full primary key as arguments. Call one with fewer values than the key requires and it fails at call time with KandraSchemaException, naming the missing column — not a silent partition wipe.",
    href: "/battle-scars/clustering-keys-and-lookup-tables",
    icon: PartitionDeleteIcon,
  },
  {
    severity: "P0",
    q: "My ORM says it's atomic — but is it really?",
    problem:
      "Cassandra's LOGGED BATCH is the only cross-table atomicity primitive, and it's easy to write code that looks transactional (a few save() calls in a row) while it actually runs as N independent, non-atomic writes.",
    fix: "KandraBatchScope exists specifically for this — and its methods are named saveInBatch, not save, a direct scar from almost shipping an API that silently didn't provide the atomicity it promised.",
    href: "/battle-scars/batch-scope-shadowing",
    icon: BatchAtomicIcon,
  },
  {
    severity: "P1",
    q: "Why does this need ALLOW FILTERING, and why is everyone telling me not to use it?",
    problem:
      "Cassandra will let you write a query that triggers a full-cluster scatter-gather scan, and it will degrade a production cluster badly under load. Most ORMs don't stop you.",
    fix: "Kandra's predicate query DSL (find {} / findAll {}) structurally cannot express ALLOW FILTERING — every predicate resolves through a partition key, @LookupIndex, or @SecondaryIndex, or the query throws at build time. The one exception is findActive() on @SoftDelete entities, which always scans the whole table with ALLOW FILTERING — logged with a WARN naming the cost, not silent, but not something the DSL stops you from reaching for.",
    href: "/foundations",
    icon: ScanBlockedIcon,
  },
  {
    severity: "P1",
    q: "Tombstones are eating my cluster and nobody told me.",
    problem:
      "Naive DELETE-heavy workloads generate tombstones that degrade read performance until compaction catches up, days later by default. Most relational-background developers have never had to think about this.",
    fix: "@SoftDelete uses a TTL, not a DELETE. And when deleteAll() would actually generate a lot of tombstones, it logs an explicit WARN with the count — before it becomes a 3am page.",
    href: "/recipes/soft-delete",
    icon: TombstoneIcon,
  },
  {
    severity: "P2",
    q: "I need compare-and-set, but LWT is expensive — how do I not pay that cost everywhere?",
    problem:
      "Lightweight Transactions (Paxos-based) give you real compare-and-set semantics, but at a real latency cost most relational developers have never had to reason about — SQL transactions don't ask you to.",
    fix: "Plain writes are the default path. @Version and saveIfNotExists are something you opt into deliberately, visible in the entity definition — not hidden behind a @Transactional that quietly does something different per isolation level.",
    href: "/philosophy/consistency",
    icon: ScaleCostIcon,
  },
  {
    severity: "P1",
    q: "Why does my read work in dev but throw in production?",
    problem:
      "Partition-scoped design (or its absence) is invisible on a small dev dataset and catastrophic at scale.",
    fix: "Kandra's schema and query validation run at plugin install — startup — not first request. A query that can't be served without a full scan is caught before deploy, not discovered under load.",
    href: "/philosophy/schema-safety",
    icon: StartupFlagIcon,
  },
];

const BUSINESS_CASES = [
  {
    title: "Prevent costly incidents",
    icon: PartitionDeleteIcon,
    business:
      "A relational-instinct delete or a batch that only looks atomic are exactly the kind of mistake that ships clean, passes review, and pages someone in production. Both are real, root-caused bugs from Kandra's own development, not hypotheticals.",
    technical:
      "Full-key requirements on deleteById/findById (fails loudly with KandraSchemaException, not silently) and saveInBatch's distinct method name (so it can't be shadowed into a non-atomic call) are both direct fixes for issues found against a real cluster.",
    links: [
      { href: "/battle-scars/clustering-keys-and-lookup-tables", label: "ISS-025 writeup" },
      { href: "/battle-scars/batch-scope-shadowing", label: "batch-scope shadowing" },
    ],
  },
  {
    title: "Onboard engineers faster",
    icon: LinkChainIcon,
    business:
      "Cassandra's distributed model is a steep learning curve for anyone coming from a relational background, and that knowledge usually lives in one senior engineer's head. Kandra puts it in the entity definition instead.",
    technical:
      "@PartitionKey, @ClusteringKey, and @LookupIndex make partitioning and denormalization explicit, typed decisions on the data class itself — not tribal knowledge a new hire has to be told about before their first write path.",
    links: [{ href: "/philosophy/denormalization", label: "Why denormalization is explicit" }],
  },
  {
    title: "Reduce operational overhead",
    icon: TombstoneIcon,
    business:
      "Tombstone buildup and unbudgeted LWT cost are the kind of gradual, hard-to-diagnose problems that eat on-call time without ever being one clean incident to point at.",
    technical:
      "@SoftDelete uses a TTL instead of a DELETE and warns before a bulk delete would generate real tombstone volume. @Version/saveIfNotExists (LWT) stay opt-in and visible in the entity, never a hidden default you're paying for on every write.",
    links: [
      { href: "/recipes/soft-delete", label: "@SoftDelete recipe" },
      { href: "/philosophy/consistency", label: "Consistency & LWT cost" },
    ],
  },
];

const ADOPTION_STEPS = [
  {
    step: "Evaluate",
    body:
      "Read /foundations and /battle-scars before writing code — the distributed-systems tradeoffs and the real bugs they came from are the actual pitch, not a features list. Drop kandra-runtime + kandra-ktor into one service; nothing else has to change.",
  },
  {
    step: "Pilot",
    body:
      "Model one bounded context's tables with real @PartitionKey/@ClusteringKey/@LookupIndex decisions. Schema and query-shape validation at install time means a bad model fails at startup in a pilot, not under load in production.",
  },
  {
    step: "Scale",
    body:
      "The annotations that caught mistakes in the pilot are the same ones in production — nothing changes shape between the two. Standardizing means one distributed-data vocabulary across every Kotlin service, not one team's tribal knowledge.",
  },
];

const BATTLE_SCAR_HIGHLIGHTS = [
  {
    href: "/battle-scars/clustering-keys-and-lookup-tables",
    title: "Clustering keys & lookup tables",
    body: "A delete call that was supposed to remove one row instead removed an entire partition. Tightening the fix correctly then broke lookup-index resolution and soft-delete for the same entities, in sequence, over three issues.",
  },
  {
    href: "/battle-scars/batch-scope-shadowing",
    title: "The batch-scope shadowing saga",
    body: "KandraBatchScope's save/delete compiled, ran, and returned success, and never once actually put anything in a batch. Kotlin's overload resolution rules made sure of it.",
  },
  {
    href: "/battle-scars/testing-lwt-and-fakes",
    title: "Testing the untestable: LWT & fakes",
    body: "The in-memory test fake Kandra's own unit tests ran against couldn't fail in ways that mattered — and how the project found out its blocking-vs-suspend split had never actually been exercised.",
  },
];

function SeverityBadge({ level }: { level: string }) {
  return (
    <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-mono font-semibold ${SEVERITY_STYLE[level]}`}>
      {level}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero — dual-track: Developers panel reuses the site's existing, verified pitch;
          Teams panel is new, grounded in the same sourced failure modes, no invented stats. */}
      <section className="cluster-grid relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-paper/40 via-paper/85 to-paper pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-4 md:px-6 pt-16 pb-10 md:pt-20 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border-l-2 border-accent pl-5">
              <p className="font-mono text-xs text-accent-strong tracking-wide mb-4">
                {`v${KANDRA_VERSION} · Apache 2.0 · Kotlin + ScyllaDB/Cassandra`}
              </p>
              <h1 className="font-display font-semibold text-3xl md:text-[2.6rem] leading-[1.08] tracking-tight">
                A Kotlin ORM that doesn&apos;t pretend Cassandra is SQL with extra steps.
              </h1>
              <p className="mt-5 text-ink-muted leading-relaxed">
                Kandra is a Ktor-native ORM for ScyllaDB and Cassandra. It makes partitioning,
                denormalization, and distributed tradeoffs visible in your entity definitions
                &mdash; so the query that looks correct actually is.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/getting-started"
                  className="glow-accent inline-flex items-center rounded-md bg-accent text-accent-ink px-5 py-2.5 text-sm font-medium hover:bg-accent-strong transition-all"
                >
                  Get started in 5 minutes &rarr;
                </Link>
                <a
                  href={KANDRA_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-ink hover:border-border-strong transition-colors"
                >
                  View on GitHub
                </a>
              </div>
              <div className="hidden lg:block mt-8 w-full min-w-0 max-w-full overflow-hidden text-sm [&_.kandra-codeblock]:shadow-none [&_.kandra-codeblock]:text-xs [&_.kandra-codeblock]:max-w-full [&_.kandra-codeblock_pre]:max-w-full">
                <HeroCode />
              </div>
            </div>

            <div className="border-l-2 border-note pl-5">
              <p className="font-mono text-xs text-note tracking-wide mb-4">For teams evaluating an ORM</p>
              <h2 className="font-display font-semibold text-3xl md:text-[2.6rem] leading-[1.08] tracking-tight">
                The Cassandra mistakes that page your team at 3am &mdash; caught before they ship.
              </h2>
              <p className="mt-5 text-ink-muted leading-relaxed">
                Partition-wide deletes, batches that look atomic and aren&apos;t, tombstone buildup
                that degrades reads for days &mdash; every one of these is a real, root-caused bug
                from Kandra&apos;s own development against a live cluster, not a theoretical pitch.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#business-case"
                  className="glow-note inline-flex items-center rounded-md bg-note text-accent-ink px-5 py-2.5 text-sm font-medium transition-all"
                >
                  See the business case &darr;
                </a>
                <Link href="/battle-scars" className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-ink hover:border-border-strong transition-colors">
                  Read the battle scars
                </Link>
              </div>
              <p className="mt-6 font-mono text-xs text-ink-faint leading-relaxed max-w-md">
                Every failure mode on this page is documented with a root cause and a fix &mdash;{" "}
                <Link href="/battle-scars" className="underline decoration-border-strong hover:decoration-current">
                  not hypothetical
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <PersonaToggle variant="hero" />
          </div>
        </div>
      </section>

      {/* Before/after — the corrected ISS-025 story: a real historical bug, and the real,
          runtime (not compiler) safeguard that replaced it. */}
      <ScrollReveal className="mx-auto max-w-[1400px] px-4 md:px-6 py-14 md:py-16">
        <div className="max-w-2xl mb-6">
          <h2 className="font-display font-semibold text-2xl tracking-tight">One call site, two eras</h2>
          <p className="mt-3 text-ink-muted leading-relaxed">
            This isn&apos;t a hypothetical &mdash; it&apos;s ISS-025, a real data-loss bug caught in
            Kandra&apos;s own development, and the fix that replaced a silent partition wipe with a
            loud, named, call-time exception.{" "}
            <Link href="/battle-scars/clustering-keys-and-lookup-tables" className="underline decoration-border-strong hover:decoration-current">
              Full writeup &rarr;
            </Link>
          </p>
        </div>
        <BeforeAfterToggle before={<BeforeDelete />} after={<AfterDelete />} />
      </ScrollReveal>

      {/* Trust bar — real brand marks only where a real factual claim is being made. */}
      <section className="border-y border-border">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted">
            <PackageIcon className="text-accent-strong shrink-0" /> Maven Central
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted">
            <LicenseIcon className="text-accent-strong shrink-0" /> Apache 2.0
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted">
            <BrandLogo icon={siKotlin} size={16} /> Kotlin 2.1+
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted">
            <BrandLogo icon={siScylladb} size={16} /> ScyllaDB
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted">
            <BrandLogo icon={siApachecassandra} size={16} /> Apache Cassandra
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted">
            <PlugIcon className="text-accent-strong shrink-0" /> Ktor Native
          </span>
        </div>
      </section>

      {/* Severity-tagged incident grid */}
      <section id="why-kandra" className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20 scroll-mt-20">
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
          {PAIN_POINTS.map((p, i) => (
            <ScrollReveal key={p.q} delayMs={(i % 2) * 80}>
              <Link
                href={p.href}
                className="group block h-full rounded-lg border border-border p-5 hover:border-border-strong hover:bg-paper-raised/60 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2.5">
                  <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-md border border-border text-accent-strong group-hover:border-border-strong">
                    <p.icon className="w-[15px] h-[15px]" />
                  </span>
                  <h3 className="font-display font-semibold text-base leading-snug flex-1">{p.q}</h3>
                  <SeverityBadge level={p.severity} />
                </div>
                <p className="text-sm text-ink-muted leading-relaxed mb-3">{p.problem}</p>
                <p className="text-sm leading-relaxed border-l-2 border-accent pl-3">{p.fix}</p>
                <span className="mt-3 inline-block text-xs font-mono text-accent-strong opacity-0 group-hover:opacity-100 transition-opacity">
                  more &rarr;
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Business case — decision-maker framing, sourced only from the facts above. */}
      <section id="business-case" className="border-t border-border bg-paper-raised/40 scroll-mt-20">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              The business case for Kandra
            </h2>
            <p className="mt-4 text-ink-muted leading-relaxed">
              Every card below is backed by a real, linked incident or a real annotation &mdash;
              insurance, not a features list.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BUSINESS_CASES.map((c, i) => (
              <ScrollReveal key={c.title} delayMs={i * 100}>
                <div className="h-full rounded-lg border border-border p-6">
                  <c.icon className="text-note mb-3 w-5 h-5" />
                  <h3 className="font-display font-semibold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-ink leading-relaxed mb-3">{c.business}</p>
                  <p className="text-sm text-ink-muted leading-relaxed mb-4">{c.technical}</p>
                  <div className="flex flex-col gap-1.5">
                    {c.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="text-xs font-mono text-accent-strong hover:underline"
                      >
                        {l.label} &rarr;
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Code showcase */}
      <section id="code-showcase" className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20 scroll-mt-20">
        <div className="max-w-2xl mb-8">
          <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
            The API that respects the database
          </h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            Three files, one running app: an entity that states its partitioning and lifecycle
            up front, a repository call site where atomicity is a named method, and a plugin
            install where the schema and connection settings live in one place.
          </p>
        </div>
        <Tabs
          items={[
            { value: "entities", label: "entities.kt", content: <ShowcaseEntities /> },
            { value: "repository", label: "routes.kt", content: <ShowcaseRepository /> },
            { value: "ktor", label: "Application.kt", content: <ShowcaseKtor /> },
          ]}
        />
      </section>

      {/* Comparison — 3 columns */}
      <section id="comparison" className="border-t border-border bg-paper-raised/40 scroll-mt-20">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20">
          <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight max-w-2xl">
            If you want SQL magic, use Spring Data. If you want raw control, use the driver
            directly. If you want Cassandra-native Kotlin, use Kandra.
          </h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-border-strong text-left">
                  <th className="py-3 pr-6 font-display font-semibold text-ink-faint text-xs uppercase tracking-wide">
                    &nbsp;
                  </th>
                  <th className="py-3 pr-6 font-display font-semibold text-ink-faint">Raw DataStax Driver</th>
                  <th className="py-3 pr-6 font-display font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <BrandLogo icon={siSpringboot} size={14} /> Spring Data Cassandra
                    </span>
                  </th>
                  <th className="py-3 font-display font-semibold text-accent-strong">Kandra</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border">
                    <td className="py-4 pr-6 text-ink-faint font-mono text-xs align-top whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="py-4 pr-6 text-ink-faint align-top">{row.raw}</td>
                    <td className="py-4 pr-6 text-ink-muted align-top">{row.spring}</td>
                    <td className="py-4 text-ink align-top">{row.kandra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Adoption path */}
      <section className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
            Start small. Scale with confidence.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ADOPTION_STEPS.map((s, i) => (
            <ScrollReveal key={s.step} delayMs={i * 100}>
              <div className="h-full rounded-lg border border-border p-6">
                <span className="font-mono text-xs text-note">{`0${i + 1}`}</span>
                <h3 className="font-display font-semibold text-lg mt-1 mb-2">{s.step}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{s.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Battle-scars pull-through — real, verifiable substance instead of vanity metrics. */}
      <section className="border-t border-border bg-paper-raised/40">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              Battle-tested, not theoretical
            </h2>
            <p className="mt-4 text-ink-muted leading-relaxed">
              Every entry is a real bug found in Kandra&apos;s own codebase, with a root cause and
              a fix &mdash; none of it deleted once it became inconvenient.{" "}
              <Link href="/battle-scars" className="underline decoration-border-strong hover:decoration-current">
                See all battle scars &rarr;
              </Link>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BATTLE_SCAR_HIGHLIGHTS.map((b, i) => (
              <ScrollReveal key={b.href} delayMs={i * 100}>
                <Link href={b.href} className="group block h-full rounded-lg border border-border p-5 hover:border-border-strong transition-colors">
                  <h3 className="font-display font-semibold text-base mb-2">{b.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{b.body}</p>
                  <span className="mt-3 inline-block text-xs font-mono text-accent-strong opacity-0 group-hover:opacity-100 transition-opacity">
                    read &rarr;
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="hidden md:flex justify-center py-10 text-ink-faint" aria-hidden="true">
        <ChariotScene className="w-64 h-auto opacity-70" />
      </div>

      {/* Homepage footer band — dual-track, only real routes/anchors, no mailto, no Discussions. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-16 md:py-20">
          <div className="kandra-codeblock max-w-xl mb-10">
            <div className="px-4 py-1.5 border-b border-border text-xs font-mono text-ink-muted">terminal</div>
            <pre className="overflow-x-auto px-4 py-3 text-sm font-mono leading-relaxed">
              <code>
                <span className="text-ink-faint">$ </span>
                {`./gradlew dependencies | grep kandra`}
                {"\n"}
                {`+--- ke.co.coinx.kandra:kandra-runtime:${KANDRA_VERSION}`}
              </code>
            </pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div>
              <div className="font-display font-semibold mb-3 text-accent-strong">For Developers</div>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li><Link href="/getting-started" className="hover:text-accent">Get started</Link></li>
                <li><Link href="/tutorial" className="hover:text-accent">Tutorial</Link></li>
                <li><a href={KANDRA_REPO_URL} target="_blank" rel="noreferrer" className="hover:text-accent">GitHub</a></li>
                <li><a href={`${KANDRA_REPO_URL}/issues`} target="_blank" rel="noreferrer" className="hover:text-accent">Report an issue</a></li>
              </ul>
            </div>
            <div>
              <div className="font-display font-semibold mb-3 text-note">For Teams</div>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li><Link href="/battle-scars" className="hover:text-accent">Battle scars</Link></li>
                <li><Link href="/why" className="hover:text-accent">Why Kandra</Link></li>
                <li><Link href="/faq" className="hover:text-accent">FAQ</Link></li>
                <li><a href="#comparison" className="hover:text-accent">See the comparison</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/getting-started"
              className="glow-accent inline-flex items-center rounded-md bg-accent text-accent-ink px-5 py-2.5 text-sm font-medium hover:bg-accent-strong transition-all"
            >
              Read the full docs &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { siKotlin, siApachecassandra, siSpringboot, siScylladb } from "simple-icons";
import { ChariotScene } from "@/components/illustrations/chariot-scene";
import { KANDRA_VERSION, KANDRA_REPO_URL } from "@/lib/site-config";
import { Tabs } from "@/components/tabs";
import { BrandLogo } from "@/components/brand-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { BeforeAfterToggle } from "@/components/homepage/before-after-toggle";
import { AzTopologySection } from "@/components/homepage/az-topology-section";
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

const SEVERITY_STYLE: Record<string, { label: string; className: string }> = {
  P0: { label: "Data loss", className: "text-danger" },
  P1: { label: "Production risk", className: "text-gotcha" },
  P2: { label: "Cost", className: "text-tip" },
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
    fix: "Kandra's predicate query DSL (find {} / findAll {}) structurally cannot express ALLOW FILTERING — every predicate resolves through a partition key, @LookupIndex, or @SecondaryIndex, or the query throws at build time. The one exception is findActive() on @SoftDelete entities, which always scans the whole table with ALLOW FILTERING — logged with a WARN naming the cost. The next release makes that an explicit opt-in too: without a @SecondaryIndex on the marker, findActive() throws unless you pass allowFullScan = true.",
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

function SeverityLabel({ level }: { level: string }) {
  const { label, className } = SEVERITY_STYLE[level];
  return <span className={`text-xs font-semibold ${className}`}>{label}</span>;
}

function SectionIntro({
  eyebrow,
  title,
  children,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`max-w-3xl mb-12 md:mb-16 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="type-eyebrow mb-3">{eyebrow}</p>}
      <h2 className="type-headline text-balance">{title}</h2>
      {children && <p className="type-lede mt-5 text-pretty">{children}</p>}
    </div>
  );
}

const inlineLink = "text-accent-strong hover:underline underline-offset-4";

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero: one message, one focal object (the code), nothing moving behind it. */}
      <section className="mx-auto max-w-[1100px] px-4 md:px-6 pt-16 pb-20 md:pt-28 md:pb-28 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, plain SVG */}
        <img src="/brand/kandra-octopus.svg" alt="" width={168} height={139} className="mx-auto mb-6 h-28 md:h-36 w-auto" />
        <p className="type-eyebrow mb-5">Kandra {KANDRA_VERSION}</p>
        <h1 className="type-hero text-balance mx-auto max-w-4xl">
          A Kotlin ORM that doesn&apos;t pretend Cassandra is SQL with extra steps.
        </h1>
        <p className="type-lede mt-6 mx-auto max-w-2xl text-pretty">
          A Ktor-native ORM for ScyllaDB and Cassandra. Partitioning, denormalization, and
          distributed tradeoffs are visible in your entity definitions &mdash; so the query that
          looks correct actually is.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/getting-started" className="btn btn-primary">
            Get started
          </Link>
          <a href={KANDRA_REPO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
            View on GitHub
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
          <li className="inline-flex items-center gap-1.5">
            <BrandLogo icon={siKotlin} size={14} /> Kotlin 2.1+
          </li>
          <li className="inline-flex items-center gap-1.5">
            <BrandLogo icon={siScylladb} size={14} /> ScyllaDB
          </li>
          <li className="inline-flex items-center gap-1.5">
            <BrandLogo icon={siApachecassandra} size={14} /> Cassandra
          </li>
          <li className="inline-flex items-center gap-1.5">
            <PlugIcon className="w-3.5 h-3.5" /> Ktor plugin
          </li>
          <li className="inline-flex items-center gap-1.5">
            <PackageIcon className="w-3.5 h-3.5" /> Maven Central
          </li>
          <li className="inline-flex items-center gap-1.5">
            <LicenseIcon className="w-3.5 h-3.5" /> Apache 2.0
          </li>
        </ul>
        <div className="hero-code mt-14 md:mt-20 mx-auto max-w-3xl text-left text-sm">
          <HeroCode />
        </div>
      </section>

      {/* Before/after: ISS-025, a real historical bug, and the runtime safeguard that replaced it. */}
      <section className="bg-paper-raised">
        <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28">
          <ScrollReveal>
            <SectionIntro eyebrow="ISS-025" title="One call site, two eras.">
              Not a hypothetical: a real data-loss bug caught in Kandra&apos;s own development, and
              the fix that turned a silent partition wipe into a loud, named, call-time exception.{" "}
              <Link href="/battle-scars/clustering-keys-and-lookup-tables" className={inlineLink}>
                Read the writeup &rsaquo;
              </Link>
            </SectionIntro>
            <div className="card-elevated p-4 md:p-6">
              <BeforeAfterToggle before={<BeforeDelete />} after={<AfterDelete />} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Failure modes, each linked to where it's explained. */}
      <section id="why-kandra" className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28 scroll-mt-20">
        <ScrollReveal>
          <SectionIntro title="What building on Cassandra feels like without this.">
            Every one of these is a real failure mode, and several are root-caused bugs from
            Kandra&apos;s own development against a real cluster. A partition-oriented, leaderless
            database needs distributed thinking &mdash; that starts with naming the pain plainly.{" "}
            <Link href="/why" className={inlineLink}>
              Read the full argument &rsaquo;
            </Link>
          </SectionIntro>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {PAIN_POINTS.map((p) => (
            <ScrollReveal key={p.q}>
              <Link href={p.href} className="card card-link group flex flex-col h-full p-6 md:p-7">
                <div className="flex items-center gap-2 mb-3">
                  <p.icon className="w-4 h-4 text-ink-muted" />
                  <SeverityLabel level={p.severity} />
                </div>
                <h3 className="type-title mb-3">{p.q}</h3>
                <p className="text-[0.95rem] text-ink-muted leading-relaxed mb-4">{p.problem}</p>
                <p className="text-[0.95rem] leading-relaxed">{p.fix}</p>
                <span className="mt-auto pt-4 text-sm text-accent-strong group-hover:underline underline-offset-4">
                  Learn more &rsaquo;
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <AzTopologySection />

      {/* Business case: decision-maker framing, sourced only from the facts above. */}
      <section id="business-case" className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28 scroll-mt-20">
        <ScrollReveal>
          <SectionIntro
            eyebrow="For teams evaluating an ORM"
            title="The Cassandra mistakes that page your team at 3am, caught before they ship."
          >
            Partition-wide deletes, batches that look atomic and aren&apos;t, tombstone buildup that
            degrades reads for days. Every card below is backed by a real, linked incident or a
            real annotation.
          </SectionIntro>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {BUSINESS_CASES.map((c) => (
            <ScrollReveal key={c.title}>
              <div className="card h-full p-6 md:p-7 flex flex-col">
                <c.icon className="text-accent-strong mb-4 w-6 h-6" />
                <h3 className="type-title mb-3">{c.title}</h3>
                <p className="text-[0.95rem] leading-relaxed mb-3">{c.business}</p>
                <p className="text-[0.95rem] text-ink-muted leading-relaxed mb-5">{c.technical}</p>
                <div className="mt-auto flex flex-col gap-1.5">
                  {c.links.map((l) => (
                    <Link key={l.href} href={l.href} className={`text-sm ${inlineLink}`}>
                      {l.label} &rsaquo;
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Code showcase */}
      <section id="code-showcase" className="bg-paper-raised scroll-mt-20">
        <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28">
          <ScrollReveal>
            <SectionIntro eyebrow="For developers" title="An API that respects the database.">
              Three files, one running app: an entity that states its partitioning and lifecycle up
              front, a repository call site where atomicity is a named method, and a plugin install
              where schema and connection settings live in one place.
            </SectionIntro>
            <div className="card-elevated p-1.5 md:p-2 [&>div]:my-0">
              <Tabs
                items={[
                  { value: "entities", label: "entities.kt", content: <ShowcaseEntities /> },
                  { value: "repository", label: "routes.kt", content: <ShowcaseRepository /> },
                  { value: "ktor", label: "Application.kt", content: <ShowcaseKtor /> },
                ]}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28 scroll-mt-20">
        <ScrollReveal>
          <SectionIntro title="Choose the tool that matches the database.">
            If you want SQL magic, use Spring Data. If you want raw control, use the driver
            directly. If you want Cassandra-native Kotlin, use Kandra.
          </SectionIntro>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full text-[0.95rem] border-collapse min-w-[720px]">
              <thead>
                <tr className="text-left border-b border-border-strong">
                  <th className="py-3 pr-6 w-40" />
                  <th className="py-3 pr-6 font-semibold text-ink-muted">DataStax driver</th>
                  <th className="py-3 pr-6 font-semibold text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <BrandLogo icon={siSpringboot} size={14} /> Spring Data Cassandra
                    </span>
                  </th>
                  <th className="py-3 font-semibold text-accent-strong">Kandra</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border">
                    <th scope="row" className="py-5 pr-6 text-left font-semibold align-top">
                      {row.label}
                    </th>
                    <td className="py-5 pr-6 text-ink-muted align-top">{row.raw}</td>
                    <td className="py-5 pr-6 text-ink-muted align-top">{row.spring}</td>
                    <td className="py-5 align-top">{row.kandra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </section>

      {/* Adoption path */}
      <section className="bg-paper-raised">
        <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28">
          <ScrollReveal>
            <SectionIntro title="Start small. Scale with confidence." />
          </ScrollReveal>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {ADOPTION_STEPS.map((s, i) => (
              <ScrollReveal key={s.step}>
                <li className="card-elevated h-full p-6 md:p-7">
                  <span className="text-sm font-semibold text-accent-strong tabular-nums">Step {i + 1}</span>
                  <h3 className="type-title mt-1 mb-3">{s.step}</h3>
                  <p className="text-[0.95rem] text-ink-muted leading-relaxed">{s.body}</p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Battle scars: real, verifiable substance instead of vanity metrics. */}
      <section className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28">
        <ScrollReveal>
          <SectionIntro title="Battle-tested, not theoretical.">
            Every entry is a real bug found in Kandra&apos;s own codebase, with a root cause and a
            fix &mdash; none of it deleted once it became inconvenient.{" "}
            <Link href="/battle-scars" className={inlineLink}>
              See all battle scars &rsaquo;
            </Link>
          </SectionIntro>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {BATTLE_SCAR_HIGHLIGHTS.map((b) => (
            <ScrollReveal key={b.href}>
              <Link href={b.href} className="card card-link group flex flex-col h-full p-6 md:p-7">
                <h3 className="type-title mb-3">{b.title}</h3>
                <p className="text-[0.95rem] text-ink-muted leading-relaxed">{b.body}</p>
                <span className="mt-auto pt-4 text-sm text-accent-strong group-hover:underline underline-offset-4">
                  Read &rsaquo;
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28 text-center">
          <ChariotScene className="w-40 h-auto mx-auto mb-8 text-ink-faint" />
          <h2 className="type-headline text-balance">Add it to one service. Nothing else changes.</h2>
          <div className="mt-8 mx-auto max-w-md kandra-codeblock text-left">
            <pre className="px-5 py-4 text-sm font-mono overflow-x-auto">
              <code>
                <span className="text-ink-faint select-none">$ </span>
                {`./gradlew dependencies | grep kandra`}
                {"\n"}
                <span className="text-ink-muted">{`+--- ke.co.coinx.kandra:kandra-runtime:${KANDRA_VERSION}`}</span>
              </code>
            </pre>
          </div>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/getting-started" className="btn btn-primary">
              Read the docs
            </Link>
            <Link href="/tutorial" className="btn btn-secondary">
              Take the tutorial
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            <Link href="/faq" className={inlineLink}>FAQ</Link>
            <span className="mx-2 text-ink-faint">·</span>
            <a href={`${KANDRA_REPO_URL}/issues`} target="_blank" rel="noreferrer" className={inlineLink}>
              Report an issue
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

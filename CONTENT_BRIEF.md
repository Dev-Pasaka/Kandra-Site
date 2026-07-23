# Content authoring brief — read this before writing any MDX page

You're writing content for the Kandra documentation site (`/Users/pasaka/Developer/KandraWebsite/site`),
a Next.js 16 + MDX site for **Kandra**, a Kotlin-first ORM for ScyllaDB/Cassandra shipped as a Ktor
plugin. The library's real source lives at `/Users/pasaka/Developer/Kandra` (a separate local
directory — read it, don't guess).

## Non-negotiable accuracy rule

**Every claim about behavior, every code example, every annotation name, every method signature must be
verified against the actual current source in `/Users/pasaka/Developer/Kandra`.** Do not trust any
prompt, spec, or even this brief for exact names — verify against source. Known example of source
drift you WILL hit: the repo's own `docs/USER_GUIDE.md` still says `@LookupTable` in one heading; the
real annotation, confirmed in `kandra-core/src/main/kotlin/io/kandra/core/annotations/Annotations.kt`,
is `@LookupIndex`. If you find a similar mismatch between two source-of-truth docs, trust the actual
`.kt` source over any Markdown doc, and prefer the newer/higher-numbered ISS entry over an older one on
the same topic.

Primary sources, in order of trust:
1. Actual Kotlin source under `<module>/src/main/kotlin/`
2. `.claude/skills/kandra-*/SKILL.md` (per-module, exhaustive, source-verified — best single source for
   module reference content)
3. `README.md`, `docs/USER_GUIDE.md`, `docs/features/*.md`
4. `docs/issues/ISS-*.md` — real bugs, root cause, fix. Gold for battle-scars content.
5. `docs/changelog/*.md`, `docs/history/*.md`, `docs/test-plan*/`

Known facts already verified this session (reuse, don't re-derive):
- Current version: **0.4.5** (`gradle.properties`). Maven coordinates use groupId `ke.co.coinx.kandra`;
  Kotlin package namespace is `io.kandra.*` — these are genuinely different strings, both correct.
- Query DSL has no `+` prefix: `UserTable.email eq "x"`.
- `KandraBatchScope` methods: `saveInBatch`, `deleteInBatch`, `saveIfNotExistsInBatch` (not
  `save`/`delete`) — deliberate, because Kotlin resolves a same-named member over an extension.
  `KandraRuntime.batch { }` (suspend) / `.batchBlocking { }` (blocking) enter the scope; in Ktor,
  `application.kandra.batch { }`. Batch APIs are `@OptIn(ExperimentalKandraApi::class)`.
- `@LookupIndex(tableSuffix, consistency = LookupConsistency.BATCH | EVENTUAL)`.
- `SchemaMode`: `AUTO_CREATE` (default), `AUTO_MIGRATE`, `VALIDATE`, `NONE`. All DDL runs at plugin
  install (startup), not first request.
- Kandra does **not** support `ALLOW FILTERING` at all — no DSL escape hatch, by design. A query on a
  non-key column requires `@SecondaryIndex` (logs WARN, scatter-gather) or `@LookupIndex` (denormalized
  table) instead.
- `@Version` (optimistic locking): `save()` sets initial version; only `update(old, new)` enforces the
  LWT check (`UPDATE ... IF version = ?`), throws `KandraOptimisticLockException` on conflict.
  `updateForce()` bypasses it.
- `@SoftDelete(ttlSeconds, markerProperty)`: delete() becomes `UPDATE ... USING TTL` on non-key columns,
  not a real DELETE. `findActive()` does a full-table-scan-with-filter — not partition-scoped; ordinary
  `findPage`/`findAll` + client-side filter is the right tool for "my non-deleted rows".
  `deleteAll()` logs an explicit WARN with the row/tombstone count above `tombstoneWarnThreshold`
  (default 1000).
- Consistency: `KandraConsistency` enum — verified from actual source, **no `ANY` value** (an earlier
  draft of this brief wrongly included it, copied from a stale line in `docs/USER_GUIDE.md`): `ONE,
  TWO, THREE, QUORUM, ALL, LOCAL_QUORUM, EACH_QUORUM, LOCAL_ONE, LOCAL_SERIAL, SERIAL`. Resolution
  order (verified against `StatementBuilder.kt`): per-call `consistency` param → `@ReadConsistency`/
  `@WriteConsistency` on the entity class → `ConsistencyConfig.defaultRead`/`defaultWrite` (global
  default: read=`LOCAL_ONE`, write=`LOCAL_QUORUM`). First non-null wins, no merging.
- `LookupIndex(consistency = LookupConsistency.EVENTUAL)` fires via `scope.launch { runCatching { ... } }`
  with **no automatic retry** — a failed eventual write just logs an error and calls
  `KandraEventListener.onEventualWriteFailed` if wired; it does not self-heal. Don't describe this as
  merely "a bounded lag window" — the failure mode is a lookup row that stays wrong until something
  external intervenes, not just briefly stale.
- Dokka is published at `https://dev-pasaka.github.io/kandra/v0.4.3/` (verified live) — **note the
  published Dokka version (0.4.3) lags the current source (0.4.5)**; use the `dokkaClassUrl` /
  `dokkaModuleUrl` / `dokkaPackageUrl` helpers from `lib/dokka.ts`, don't hand-build Dokka URLs. Their
  slug rule (verified against the live site): `PartitionKey` → `-partition-key/index.html`.

## Voice (§8 of the build brief — treat as binding)

Write like the `.claude/skills/*/SKILL.md` files and `docs/issues/*.md` files: direct, specific,
technically honest. Say "this is a footgun" or "this used to be broken, here's why" plainly. No
marketing copy, no "blazingly fast," no vague superlatives — every claim backed by a concrete mechanism
or link. The reader is a working engineer, not a prospect. Where Kandra made a real tradeoff (LWT cost,
the `+`-free DSL breaking old call sites, `FakeKandraSession`'s deliberate limits — see ISS-020), say so
plainly. This site should read like it was written by whoever wrote the ISS postmortems — someone who
ran this against a real cluster and hit the real problems.

Do **not** teach Cassandra by analogy to SQL. State plainly that a distributed, partition-oriented,
leaderless database needs distributed thinking, not a relational mental model in a Kotlin costume.
Denormalization is normal and correct here, not a workaround.

## Design system — components available in every MDX file (no import needed)

- `<Callout kind="note|tip|gotcha|danger" title="optional">...</Callout>` — use liberally wherever
  source material flags a footgun, tradeoff, or warning. Don't flatten these into plain prose.
- `<Tabs items={[{value,label,content}]} />` — for e.g. package-manager variants. Prefer plain fenced
  code blocks for everything else.
- `<SideBySide leftLabel="..." rightLabel="..." left={...} right={...} />` — two-column code comparison
  (e.g. entity ⇄ generated DDL, or relational-instinct-vs-Kandra-way). Pass actual fenced code blocks
  (` ```kotlin `, ` ```sql `) as `left`/`right` JSX children — see pattern below.
- `<VersionNote>optional context</VersionNote>` — small inline badge, "as of Kandra v0.4.5".
- Fenced code blocks: use standard MDX fences with a language tag. Add `title="path/to/File.kt"` in the
  meta string for a filename tab (e.g. ` ```kotlin title="build.gradle.kts" `). Use `showLineNumbers`
  and `{2,5-7}` (line highlight) or `` `word` `` backtick-in-comment highlighting only where it adds
  real signal, not on every block. Every code example must compile against current source — verify
  imports and package names.
- Every page's actual prose content should NOT be wrapped in extra markup — plain Markdown/MDX, the
  route's `layout.tsx` already wraps it in `.kandra-prose` and provides sidebar/TOC/prev-next/edit-link
  chrome automatically. Just write the MDX body starting from the page's `# H1`.

Example of the `SideBySide` pattern in MDX (blank lines around fences inside JSX children are required):

```mdx
<SideBySide leftLabel="Entity" rightLabel="Generated DDL">
<div>

\`\`\`kotlin
@ScyllaTable("users")
data class User(...)
\`\`\`

</div>
<div>

\`\`\`sql
CREATE TABLE users (...)
\`\`\`

</div>
</SideBySide>
```

## Frontmatter

`@next/mdx` does not parse YAML frontmatter into page metadata automatically in this setup — instead,
each `page.mdx` should export a `metadata` object Next.js reads natively:

```mdx
export const metadata = {
  title: "Page Title",
  description: "One-sentence description for <meta> and search.",
};

# Page Title

...
```

## File locations

Every route lives at `app/(docs)/<route>/page.mdx` (the `(docs)` folder is a route group — it does not
appear in the URL). Example: the URL `/philosophy/atomicity` is the file
`app/(docs)/philosophy/atomicity/page.mdx`. Create parent directories as needed. Non-MDX index pages
(e.g. section overview pages that need custom layout like a card grid) may be `page.tsx` instead — check
whether a plain content page suffices first; prefer `.mdx` unless you need a custom layout.

## What NOT to do

- Don't invent config options, methods, or annotations that don't exist in source.
- Don't compare favorably to Hibernate/JPA/Exposed except to explicitly contrast mental models — this
  site doesn't sell against a competitor.
- Don't reference the `+`-prefixed DSL or `KandraBatchScope.save`/`.delete` (pre-rename) anywhere.
- Don't build live/sandboxed query execution — static site, no backend.

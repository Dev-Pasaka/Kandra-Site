# Tutorial app spec — shared ground truth for /tutorial pages 01–15

Read this before writing any `/tutorial/NN-*` page. It fixes the concrete state of the running
example app at each checkpoint so pages written independently stay consistent with each other. If
a later page needs to change something an earlier page established, change it explicitly and note
why — don't silently drift.

The app: a multi-user todo-list Ktor server. Package root: `com.example.todos`.

## Entities (final shape, reached by the end of page 08; earlier pages show earlier subsets)

```kotlin
package com.example.todos.model

import io.kandra.core.annotations.*
import java.time.Instant
import java.util.UUID

@ScyllaTable("users")
data class User(
    @PartitionKey val userId: UUID,
    @LookupIndex(tableSuffix = "by_email", consistency = LookupConsistency.BATCH)
    val email: String,
    val displayName: String,
    @CreatedAt val createdAt: Instant = Instant.EPOCH,
)

@ScyllaTable("todos")
data class Todo(
    @PartitionKey val ownerId: UUID,
    @ClusteringKey(order = ClusteringOrder.DESC) val createdAt: Instant,
    val todoId: UUID,
    val title: String,
    val assigneeId: UUID?,
    val done: Boolean = false,
    @Version val version: Long = 1L,
    @CreatedAt val createdAtMarker: Instant = Instant.EPOCH, // do not reuse for clustering — see note below
    @UpdatedAt val updatedAt: Instant = Instant.EPOCH,
)
```

<!--
Note for the writing agent: Todo's clustering key IS createdAt itself (the timestamp the todo was
created), reused directly as the sort key — there is no separate "createdAtMarker" field in the
real design; that line above is a placeholder to flag a real modeling question page 03 must resolve
explicitly: @CreatedAt auto-sets Instant.now() at save time, and using that same property as
@ClusteringKey is fine (clustering key values are still explicit, ordinary column values — Kandra
doesn't forbid a column being both). Resolve this cleanly in page 03: Todo has ONE `createdAt`
property carrying both @ClusteringKey and @CreatedAt. Do not ship two separate timestamp fields.
Verify against actual @CreatedAt/@ClusteringKey source in kandra-core before finalizing the page —
confirm both annotations are legal on the same property (check for co-annotation restrictions in
kandra-core's schema-building code / validator before asserting this compiles).
-->

**Soft delete (introduced page 08):** add `@SoftDelete(ttlSeconds = 604_800, markerProperty =
"isDeleted")` to `@ScyllaTable` and a `val isDeleted: Boolean = false` property on `Todo` — a
7-day undo window.

**Caching (introduced page 10):** add `@CacheResult(ttlSeconds = 30, maxSize = 5_000)` to `Todo`'s
`@ScyllaTable` (the hot read path is "my todo list").

**Denormalized table (introduced page 06), separate entity, not a `@LookupIndex`** (a `Todo` can
have many rows per assignee, `@LookupIndex` is one-row-per-key — this is the deliberate contrast
page 06 has to explain):

```kotlin
@ScyllaTable("todos_by_assignee")
data class TodoByAssignee(
    @PartitionKey val assigneeId: UUID,
    @ClusteringKey(order = ClusteringOrder.DESC) val createdAt: Instant,
    val todoId: UUID,
    val ownerId: UUID,
    val title: String,
    val done: Boolean = false,
)
```

**Counter table (introduced page 09):**

```kotlin
@ScyllaTable("completion_stats")
data class CompletionStats(
    @PartitionKey val userId: UUID,
    @Counter val completedCount: Long,
)
```

## Plugin install block (final shape; build incrementally per page 04, 07, 08, 09, 10, 11, 13, 14)

```kotlin
install(Kandra) {
    contactPoints = "localhost:9042"
    keyspace = "todos"
    localDatacenter = "datacenter1"
    autoCreateKeyspace = true
    schemaMode = SchemaMode.AUTO_CREATE  // page 04: explain; page 14 contrasts with VALIDATE for prod
    register(User::class, Todo::class, TodoByAssignee::class, CompletionStats::class)

    auth { provider = KandraAuth.fromEnv() }
    pool { requestTimeoutMillis = 10_000 }
    retry { maxAttempts = 3; backoffMillis = 100 }

    debug {                                  // page 11
        logQueries = true
        logSlowQueriesMs = 500
        logBatches = true
    }

    metrics {                                // page 11
        enabled = true
        recorder = KandraMetrics { table, operation, durationMs ->
            meterRegistry.timer("kandra.query", "table", table, "operation", operation)
                .record(durationMs, TimeUnit.MILLISECONDS)
        }
    }

    healthCheck = true                       // page 11 (default true, but call out explicitly)
    shutdown { graceful = true; drainTimeoutMs = 5_000 }  // page 11
}
kandraKoin()
```

## Routes (grow incrementally; page 05 introduces the base set)

- `POST /todos` — create (`ownerId` from header/param, per page 05's auth-is-out-of-scope note)
- `GET /todos/mine` — `findPage` scoped to `ownerId`
- `GET /todos/assigned-to-me` — introduced page 06, reads `TodoByAssignee`
- `PATCH /todos/{id}/done` — mark done, introduces optimistic-lock `update()` on page 07
- `DELETE /todos/{id}` — soft delete, page 08
- `GET /todos/trash` — `findActive()`-adjacent, page 08
- `GET /users/{id}/stats` — counter read, page 09
- `GET /kandra/health` — auto-registered by the plugin, surfaced on page 11

## Auth scope (state this explicitly on page 05, don't silently assume it away)

The tutorial uses a `userId` path parameter or header (e.g. `X-User-Id`) as a stand-in for a
logged-in user. Real authentication/session management is explicitly out of scope — say so in
plain language on page 05 so the reader doesn't think it was forgotten.

## Consistency between pages — hard rules

1. `Todo`'s partition key is `ownerId`, clustering key is `createdAt DESC`, established on page 01
   from the access-pattern analysis and never silently changed later.
2. `KandraBatchScope` first appears on page 06 (denormalized write atomicity) using
   `application.kandra.batch { todoRepo.saveInBatch(todo); todoByAssigneeRepo.saveInBatch(...) }` —
   verify against actual `KandraBatchScope`/`KandraRuntime` source for the exact call shape in a
   Ktor route handler (is `application.kandra` the right accessor? confirm against
   `kandra-ktor` source before publishing).
3. `@Version` appears ONLY on `Todo`, introduced page 07, justified against `/foundations`' LWT-cost
   argument — not applied to `User` or the other tables.
4. Every numbered page must leave the reader with a working, buildable increment — don't introduce
   a field or annotation on page N that isn't wired into entities/config/routes by the end of page N.
5. Verify every annotation/config field name against actual source in
   `/Users/pasaka/Developer/Kandra` before publishing — this spec is a planning aid, not a source of
   truth for exact signatures.

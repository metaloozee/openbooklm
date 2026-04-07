# Quick Reference: Drizzle + Neon + Vercel Blob Decisions

## 🔴 CRITICAL FIX: Driver Selection

**Current (Broken for TX):**

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
// ❌ NO TRANSACTION SUPPORT
```

**Fixed (TX Support):**

```typescript
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
// ✅ TRANSACTION SUPPORT
```

---

## Pattern A: DB Transaction (< 100MB blobs)

```typescript
import { db } from "@/db";
import { put, del } from "@vercel/blob";
import { documents } from "@/schema";

export async function ingestDocument(file: File, metadata: unknown) {
  const orphans: string[] = [];

  try {
    return await db.transaction(async (tx) => {
      // Upload blob BEFORE transaction
      const blob = await put(`/uploads/${file.name}`, file, {
        access: "private",
      });
      orphans.push(blob.url);

      // Insert metadata INSIDE transaction (atomic)
      const [doc] = await tx
        .insert(documents)
        .values({
          title: metadata.title,
          blobUrl: blob.url,
          etag: blob.etag,
        })
        .returning();

      orphans.pop(); // Success, don't cleanup
      return { documentId: doc.id, blobUrl: blob.url };
    });
  } catch (error) {
    // Clean up orphaned blobs on error
    for (const url of orphans) {
      await del(url).catch(console.error);
    }
    throw error;
  }
}
```

---

## Pattern B: Staging + Flip (> 100MB blobs)

```typescript
import { put, copy, del, head } from "@vercel/blob";
import { db } from "@/db";
import { documents } from "@/schema";

export async function stagingFlipWorkflow(file: File, finalPath: string) {
  const staged = await put(`/staging/${Date.now()}/${file.name}`, file, {
    access: "private",
  });

  try {
    // Verify staged blob
    const content = await head(staged.url);
    if (!content) throw new Error("Staged blob missing");

    // Copy to final (creates duplicate)
    const final = await copy(staged.url, finalPath, {
      access: "private",
      ifMatch: staged.etag, // ETag safety
    });

    // Insert metadata in transaction
    const [doc] = await db
      .insert(documents)
      .values({
        blobUrl: final.url,
        etag: final.etag,
      })
      .returning();

    // Cleanup staging
    await del(staged.url);

    return { documentId: doc.id, finalUrl: final.url };
  } catch (error) {
    await del(staged.url).catch(console.error);
    throw error;
  }
}
```

---

## Vercel Blob API Reference

| Operation  | API                     | Atomic? | Notes                                       |
| ---------- | ----------------------- | ------- | ------------------------------------------- |
| Upload     | `put(path, body, opts)` | ✅      | Supports `ifMatch` ETag precondition        |
| Get        | `get(url)`              | ✅      | Streaming                                   |
| Delete     | `del(url \| urls[])`    | ✅      | Batch or single; `ifMatch` for precondition |
| Copy       | `copy(from, to, opts)`  | ✅      | **Creates duplicate**, not atomic rename    |
| Metadata   | `head(url)`             | ✅      | Returns etag, size, contentType             |
| List       | `list(opts)`            | ✅      | Paginated with `prefix` filter              |
| **Rename** | ❌ N/A                  | ❌      | **NOT SUPPORTED**                           |

---

## Drizzle Transaction Config

```typescript
// Basic
await db.transaction(async (tx) => {
  await tx.insert(table).values({...});
});

// With isolation level
await db.transaction(
  async (tx) => { /* ... */ },
  {
    isolationLevel: 'serializable', // 'read committed' default
    accessMode: 'read write',
  }
);

// Nested (savepoints)
await db.transaction(async (tx) => {
  await tx.transaction(async (tx2) => {
    // Independent rollback scope
  });
});
```

---

## Error Handling

### Transaction Rollback (Automatic)

```typescript
try {
  await db.transaction(async (tx) => {
    if (someError) throw new Error("rollback");
    // Full rollback if error thrown
  });
} catch (error) {
  // DB state unchanged, but blob exists → orphan
}
```

### Blob Precondition Failed

```typescript
try {
  await copy(url, path, { ifMatch: etag });
} catch (error) {
  if (error.name === "BlobPreconditionFailedError") {
    // Blob was modified externally
  }
}
```

---

## Constraints

| Constraint                      | Impact                         | Mitigation                   |
| ------------------------------- | ------------------------------ | ---------------------------- |
| Blob uploaded OUTSIDE TX        | Orphans if TX fails            | Cleanup in error handler     |
| `copy()` duplicates             | 2× storage cost, ~20s/GB       | Use for staging only         |
| No atomic rename in Blob        | Manual cleanup needed          | Track in DB, cleanup job     |
| Neon WS connections per-request | Connections leak in serverless | Call `pool.end()` in finally |
| `neon-http` no TX support       | Transactions fail silently     | Switch to `neon-serverless`  |

---

## Decision Tree

```
Is blob < 100MB?
├─ YES: Use Pattern A (TX)
│   ├─ Implement blob cleanup on error
│   └─ Done
└─ NO: Use Pattern B (Staging)
    ├─ Stage blob
    ├─ Verify ETag
    ├─ Copy to final (creates duplicate)
    ├─ Insert metadata in TX
    ├─ Delete staged blob
    └─ Add cleanup job for orphans > 1hr
```

---

## Implementation Checklist

- [ ] Migrate to `neon-serverless` driver with `Pool`
- [ ] Test `db.transaction()` works
- [ ] Implement Pattern A with blob cleanup
- [ ] Add orphan cleanup job (staging blobs > 1hr)
- [ ] Test TX rollback behavior
- [ ] Document blob orphan runbook
- [ ] For large blobs: add Pattern B staging workflow

---

## Links

- **Drizzle TX:** https://orm.drizzle.team/docs/transactions
- **Neon Driver:** https://neon.com/docs/serverless/serverless-driver
- **Vercel Blob:** https://vercel.com/docs/vercel-blob/using-blob-sdk
- **Neon + Drizzle:** https://neon.tech/guides/drizzle-local-vercel
- **Feature Request (Rename):** https://github.com/vercel/storage/issues/872

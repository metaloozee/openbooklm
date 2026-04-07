# Research Summary: Drizzle + Neon Transactions vs Vercel Blob Patterns

**April 7, 2026** | Documentation-backed guidance completed

---

## Task Completion

✅ **Gathered up-to-date official documentation for:**

- Drizzle ORM transactions (v1.0+)
- Neon Postgres drivers (HTTP vs WebSocket)
- Vercel Blob API (put, copy, delete, head operations)
- PostgreSQL transaction isolation levels

✅ **Analyzed two competing patterns:**

1. **Pattern A (DB Transaction)** – Blob + metadata in single atomic operation
2. **Pattern B (Staging + Flip)** – Blob uploaded separately, staged before final placement

✅ **Identified critical gotcha in your codebase:**

- **Current issue:** Likely using `neon-http` driver which does NOT support transactions
- **Fix:** Switch to `neon-serverless` driver with `Pool` constructor

✅ **Verified Vercel Blob capabilities:**

- ✅ Supports: put, get, delete, copy, list, head operations with ETags
- ❌ Does NOT support: atomic rename/move (Feature Request #872 open since 2025-08-22)

---

## Key Findings

### Critical: Driver Selection

| Driver            | Transactions | Mode                  | Best For                  |
| ----------------- | ------------ | --------------------- | ------------------------- |
| `neon-http`       | ❌ NO        | HTTP (single queries) | Simple reads, stateless   |
| `neon-serverless` | ✅ YES       | WebSocket             | Drizzle TX, session state |

**Your fix:** Switch from `drizzle-orm/neon-http` → `drizzle-orm/neon-serverless` + `Pool`

### Vercel Blob: No Atomic Rename

Vercel Blob `copy()` operation:

- Creates a **duplicate** (doesn't move)
- Requires manual `del()` of source
- Cost: 2× storage during copy window
- Time: ~20s per GB (per user report)

**Workaround:** Use staging pattern with cleanup jobs for orphaned blobs.

### Pattern Recommendation

**Use Pattern A (DB Transaction) if:**

- Blob < 100MB
- Can switch to `neon-serverless`
- Simple ingestion flow (upload → TX insert → done)

**Use Pattern B (Staging + Flip) if:**

- Blob > 100MB
- Network reliability concerns
- Need independent blob/DB rollback

**Hybrid (Production):** Blob staging → TX metadata insert → cleanup job

---

## Documentation Sources (Verified April 2026)

### Drizzle ORM

- **Transactions:** https://orm.drizzle.team/docs/transactions
- **Neon Setup:** https://orm.drizzle.team/docs/get-started/neon-new

### Neon

- **Serverless Driver:** https://neon.com/docs/serverless/serverless-driver
- **Drizzle Integration:** https://neon.tech/guides/drizzle-local-vercel

### Vercel

- **Blob SDK:** https://vercel.com/docs/vercel-blob/using-blob-sdk
- **Feature Request (Rename):** https://github.com/vercel/storage/issues/872

### PostgreSQL

- **Isolation Levels:** https://www.postgresql.org/docs/15/transaction-iso.html

---

## Implementation Checklist

- [ ] Audit current db/index.ts: confirm using `neon-serverless` not `neon-http`
- [ ] If using `neon-http`: migrate to `Pool` + `neon-serverless` driver
- [ ] Implement Pattern A transaction with blob cleanup on error
- [ ] Add orphan blob cleanup job (remove staging blobs > 1hr old)
- [ ] Test transaction rollback behavior
- [ ] Document blob orphan scenarios in runbook

---

## Files Generated

📄 **`docs/DRIZZLE_NEON_BLOB_GUIDANCE.md`** (748 lines)

- 6 major sections with code examples
- API signatures with exact type definitions
- Testing patterns
- Constraints & gotchas
- Decision matrix

---

## Questions Answered

### ✅ Which pattern for DB transaction + blob atomicity?

**Pattern A:** Use `neon-serverless` driver with Drizzle transactions. Blob uploaded before TX, but DB insert is atomic. Implement error handler cleanup.

### ✅ Does Vercel Blob support atomic rename/move?

**No.** `copy()` creates duplicate. Feature Request #872 open (not implemented). Use staging + cleanup jobs as workaround.

### ✅ What driver do I need for Neon transactions?

**`neon-serverless` with `Pool` constructor.** NOT `neon-http` (no TX support).

### ✅ What are the safety guarantees?

- **DB side:** Full ACID (rollback on error, supports savepoints)
- **Blob side:** Individual operations atomic, but no multi-step guarantees (need cleanup jobs)

### ✅ Recommended for production?

**Hybrid approach:** Stage blobs separately, insert metadata in TX, cleanup orphans in job.

---

**Status:** Ready for implementation  
**Next Step:** Update db configuration to use `neon-serverless` driver

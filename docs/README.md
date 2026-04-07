# Documentation: Drizzle + Neon + Vercel Blob Patterns

This directory contains comprehensive, documentation-backed guidance for implementing safe blob + database transaction patterns in your ingestion flow.

## 📄 Documents

### 1. **QUICK_REFERENCE.md** (Start here!)

- **Read time:** 5 minutes
- **For:** Developers who need immediate implementation guidance
- **Contains:**
  - 🔴 Critical driver selection fix
  - 2 complete code examples (Pattern A & B)
  - API reference table
  - Decision tree
  - Implementation checklist

**Start here if:** You have 5 minutes and need to know what to do.

### 2. **DRIZZLE_NEON_BLOB_GUIDANCE.md** (Comprehensive)

- **Read time:** 30-45 minutes
- **For:** Complete understanding of patterns and constraints
- **Contains:**
  - 6 major sections with deep explanations
  - Pattern A (DB Transaction) with error handling
  - Pattern B (Staging + Flip) with cleanup jobs
  - Exact API signatures and types
  - Constraints & gotchas
  - Testing patterns
  - Decision matrix

**Start here if:** You have time and want to understand the full picture.

## 🎯 Quick Navigation

**Question:** Which pattern should I use?

→ See **QUICK_REFERENCE.md** Decision Tree section (30 seconds)

**Question:** How do I implement Pattern A with error handling?

→ See **QUICK_REFERENCE.md** Pattern A section (3 minutes)  
OR  
**DRIZZLE_NEON_BLOB_GUIDANCE.md** Section A.2-A.3 (10 minutes)

**Question:** Does Vercel Blob support atomic rename?

→ See **DRIZZLE_NEON_BLOB_GUIDANCE.md** Section B.2 (Feature Request #872)

**Question:** What's the critical driver issue with my codebase?

→ See **QUICK_REFERENCE.md** CRITICAL FIX section (1 minute)  
OR  
**RESEARCH_SUMMARY.md** Key Findings section

---

## 📋 Decision Tree

```
Is your blob < 100MB?
├─ YES → Use Pattern A (DB Transaction)
│        See QUICK_REFERENCE.md Pattern A section
│        Takes: 10-15 minutes to implement
│
└─ NO  → Use Pattern B (Staging + Flip)
         See QUICK_REFERENCE.md Pattern B section
         Takes: 20-30 minutes to implement
         Plus: Cleanup job (10 minutes)
```

---

## 🔴 CRITICAL: Driver Selection

**If you're currently using:**

```typescript
import { drizzle } from "drizzle-orm/neon-http";
```

**You CANNOT use transactions.** Switch to:

```typescript
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
```

This is the most likely cause of your blob write issues.

---

## ✅ Key Findings

### Vercel Blob Capabilities

| Operation   | Supported? | Notes                                    |
| ----------- | ---------- | ---------------------------------------- |
| Upload      | ✅         | `put()` method                           |
| Delete      | ✅         | `del()` method, batch support            |
| Copy        | ✅         | **Creates duplicate, not atomic rename** |
| Rename/Move | ❌         | Feature Request #872 (open, unfulfilled) |

### Neon Drivers

| Driver            | Transactions | Mode                        |
| ----------------- | ------------ | --------------------------- |
| `neon-http`       | ❌ NO        | HTTP (single queries)       |
| `neon-serverless` | ✅ YES       | WebSocket (session support) |

---

## 📚 Sources (Verified April 2026)

All guidance is extracted from official documentation:

- **Drizzle Transactions:** https://orm.drizzle.team/docs/transactions
- **Neon Serverless Driver:** https://neon.com/docs/serverless/serverless-driver
- **Vercel Blob SDK:** https://vercel.com/docs/vercel-blob/using-blob-sdk
- **PostgreSQL Isolation Levels:** https://www.postgresql.org/docs/15/transaction-iso.html
- **Vercel Blob Rename Feature Request:** https://github.com/vercel/storage/issues/872

**No inference, speculation, or outdated information** – only what the official docs say (April 2026).

---

## 🚀 Implementation Path

### Phase 1: Fix Driver (30 minutes)

1. Update `src/db/index.ts` to use `neon-serverless` with `Pool`
2. Test `db.transaction()` works
3. Deploy

### Phase 2: Implement Pattern A (1 hour)

1. Add blob cleanup error handler
2. Implement ingestion transaction
3. Test rollback behavior

### Phase 3: Optional Pattern B (2 hours)

1. Implement staging workflow for large blobs
2. Add cleanup job for orphaned staging blobs
3. Configure to run hourly

### Phase 4: Documentation (30 minutes)

1. Add blob orphan scenarios to runbook
2. Document cleanup job behavior
3. Add alerts for storage usage

---

## 📞 If You Get Stuck

1. **Transaction not working?**
   - Verify you're using `neon-serverless` not `neon-http`
   - Check Pool is initialized correctly

2. **Blob orphans after error?**
   - This is expected if blob uploads before TX
   - Implement cleanup in error handler (see examples)

3. **Vercel Blob copy taking too long?**
   - `copy()` creates full duplicate
   - For large blobs, use Pattern B with async copy job

4. **Need more details?**
   - See **DRIZZLE_NEON_BLOB_GUIDANCE.md** Constraints section (D)

---

## 📝 Files in This Research

- **QUICK_REFERENCE.md** – Start-here guide with examples
- **DRIZZLE_NEON_BLOB_GUIDANCE.md** – Comprehensive deep-dive
- **README.md** – This file
- **../RESEARCH_SUMMARY.md** – Executive summary with links

---

**Status:** Ready for implementation  
**Last Updated:** April 7, 2026  
**Source:** Documentation-backed (official docs only)

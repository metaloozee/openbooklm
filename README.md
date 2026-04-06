# Document RAG

Document RAG is a Next.js application on Vercel for Retrieval Augmented Generation workflows, backed by PostgreSQL with pgvector and Vercel Blob.

The product goal is an end-to-end experience where a user can:

1. Sign in.
2. Upload documents.
3. Ask questions about those documents.
4. Receive grounded responses from an LLM based on retrieved context.

## Current Repository State

The repository is currently in the platform and authentication foundation phase.

Implemented:

- App Router project with TypeScript, Tailwind CSS v4, and shadcn/ui.
- Authentication with Better Auth + Google OAuth.
- Session-backed protected pages (page-level guards).
- Drizzle ORM configured for schema and migrations.
- PostgreSQL configured as the app database.
- pgvector-backed vector columns in the schema for embedding storage.
- Vercel Blob integration for document object storage.
- React Query provider and toaster wiring for client-side app state and UX.

Planned (not yet implemented in this repository):

- Document upload and storage pipeline hardening.
- Chunking and embedding generation pipeline improvements.
- Retrieval flow tuning.
- Prompt orchestration for grounded Q and A.
- Chat and conversation UX improvements for document question answering.

## Route Structure

This project uses App Router route groups to separate concerns while keeping clean URLs.

```text
src/app
  /(auth)
    /login/page.tsx          -> /login
  /(app)
    /page.tsx                -> /
  /api/auth/[...all]/route.ts
  /layout.tsx
```

Auth behavior:

- `/login` checks session, authenticated users are redirected to `/`.
- `/` is protected at the page level, unauthenticated users are redirected to `/login`.
- No layout-level auth guard is used.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- shadcn/ui
- Better Auth
- Drizzle ORM
- PostgreSQL + pgvector
- Vercel Blob
- Ultracite (oxlint + oxfmt) for linting and formatting

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

App URL: `http://localhost:3000`

## Environment Variables

Validated in `src/lib/env.ts`:

- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Local development

Use a gitignored `.env` (see `.gitignore`). You need at least:

- `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000`
- `BETTER_AUTH_SECRET=<strong-random-secret>`
- `DATABASE_URL=postgres://...`
- `BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`

Keep secrets in local environment files for development, and in deployment environment settings for preview and production.

### Deployment environment setup

Set the same variable names in your Vercel project environment settings so build and runtime both receive the expected values.

`NEXT_PUBLIC_BETTER_AUTH_URL` should match the deployed app URL in each environment.

## Database (Drizzle + PostgreSQL)

Generate migrations:

```bash
pnpm db:generate
```

Apply migrations:

```bash
pnpm db:migrate
```

Push schema directly:

```bash
pnpm db:push
```

Open Drizzle Studio:

```bash
pnpm db:studio
```

## Build and Run

Build the app:

```bash
pnpm build
```

Run the production server locally:

```bash
pnpm start
```

## Quality Commands

Check code quality:

```bash
pnpm check
```

Auto-fix formatting and lint issues:

```bash
pnpm fix
```

## Migration Guardrail: Cloudflare Residue Audit

Use this audit during migration to track and enforce removal of Cloudflare-specific residue.

Current script behavior (`scripts/audit-cloudflare-residue.mjs`):

- Scans tracked non-Markdown files.
- Excludes `.agents/`, `.claude/`, `.sisyphus/`, and `node_modules/`.
- Excludes `.gitignore`, `pnpm-lock.yaml`, and `skills-lock.json`.

Report mode (always exits 0, prints any markers it finds):

```bash
pnpm audit:cloudflare-residue
```

Strict mode (exits non-zero while any marker still exists):

```bash
pnpm audit:cloudflare-residue:strict
```

Markers audited:

- `@opennextjs/cloudflare`
- `getCloudflareContext`
- `CLOUDFLARE_`
- `wrangler`
- `CloudflareEnv`

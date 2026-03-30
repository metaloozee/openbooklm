# Document RAG

Document RAG is a Next.js + Cloudflare application for Retrieval Augmented Generation workflows.

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
- Cloudflare D1 (SQLite) configured as the app database.
- Drizzle ORM configured for schema and migrations.
- OpenNext Cloudflare setup for Workers-compatible builds and deployment.
- React Query provider and toaster wiring for client-side app state and UX.

Planned (not yet implemented in this repository):

- Document upload and storage pipeline.
- Chunking and embedding generation pipeline.
- Vector index and retrieval flow.
- Prompt orchestration for grounded Q&A.
- Chat/conversation UI for document question answering.

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

- `/login` checks session; authenticated users are redirected to `/`.
- `/` is protected at the page level; unauthenticated users are redirected to `/login`.
- No layout-level auth guard is used.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- shadcn/ui
- Better Auth
- Drizzle ORM
- Cloudflare D1 (SQLite)
- OpenNext for Cloudflare Workers
- Ultracite (oxlint + oxfmt) for linting/formatting

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
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_TOKEN`
- `CLOUDFLARE_DATABASE_ID`

### Local development

Use a gitignored `.env` (see `.gitignore`). You need at least:

- `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `GOOGLE_CLIENT_ID` (and secrets below)

These are **not** committed in `wrangler.jsonc` so each developer or environment can use their own values.

### Cloudflare Workers / OpenNext deploy

`NEXT_PUBLIC_*` values are embedded when the app is **built** (`opennextjs-cloudflare build`). Keep the production URL in `wrangler.jsonc` → `vars` → `NEXT_PUBLIC_BETTER_AUTH_URL` so OpenNext merges it during the build, and mirror it as a plain variable on the Worker for runtime. **Or** set `NEXT_PUBLIC_BETTER_AUTH_URL` in the shell/CI when you run the build.

**Worker dashboard (plain “Variables”, not in git):** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `GOOGLE_CLIENT_ID` — required at runtime; each collaborator or deployment can use their own.

**Worker secrets:** `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `CLOUDFLARE_D1_TOKEN` (dashboard or `wrangler secret put`), never in `wrangler.jsonc`.

## Database (Drizzle + D1)

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

## Cloudflare Build and Deploy

Build for Cloudflare/OpenNext:

```bash
pnpm cf:build
```

Preview worker output:

```bash
pnpm preview
```

Deploy:

```bash
pnpm deploy
```

## Quality Commands

Check code quality:

```bash
pnpm check
```

Auto-fix formatting/lint issues:

```bash
pnpm fix
```

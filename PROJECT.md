# OpenBookLM

An open-source, model-agnostic AI research environment where every project is a workspace, every document is a source, and every operation is conversational.

---

## Vision

OpenBookLM adopts the core strengths of Google's NotebookLM — source-grounded reasoning, rich generated artifacts, and an AI-first workflow — and re-architects them into a fully open, customizable, project-centric platform that is not locked to any single model provider.

Where NotebookLM treats notebooks as opaque containers tied to Gemini and Google's internal stack, OpenBookLM treats **projects as repos**: transparent, structured workspaces backed by a virtual file system, sandboxed compute, and a conversational control plane that lets users manage everything through chat.

The mental model for a user:

> "I create a Project for a research task. I upload sources — papers, docs, data files, URLs. An AI agent lives inside this project, knows all my sources, and can summarize, answer questions, generate artifacts, and execute code — all grounded in my uploaded materials and all through conversation."

---

## Design Goals

### 1. Open and Model-Agnostic

Support multiple LLM backends (OpenAI, Anthropic, Google, local models via Ollama, etc.) through a clean adapter layer. Retrieval, ranking, embedding, and orchestration modules should be replaceable without rewriting the product. Users can bring their own API keys or use platform-provided defaults.

### 2. Project-Centric, File-System-Native UX

Replace "Notebooks" with **Projects**, each backed by a virtual file system tree. Every artifact — uploaded documents, notes, generated reports, indexes, code files — is a first-class file in this tree. Projects are the fundamental unit of organization, sharing, and billing.

### 3. Source-Grounded by Default

Answers are grounded in project sources and cite concrete passages. Citations, provenance, and confidence levels are visible and inspectable. The system should never hallucinate beyond source material without explicit indication that it is doing so.

### 4. Sandboxed, Per-Project Compute

Each project gets a dedicated, isolated runtime for tool execution — code evaluation, data processing, visualization generation, and advanced analysis triggered via chat. Sandboxes are ephemeral but can persist state across sessions.

### 5. Conversational Control Plane

Users manage files, indexes, tools, and workflows entirely through a chat interface. The conversation is the primary interaction surface; the file explorer, artifact viewer, and settings panels are supporting views that reflect state the agent manages.

### 6. Extensible and Programmable

A plugin/tooling system supports custom operations: domain-specific parsers, visualization generators, data connectors, export pipelines. Projects can be configured with different tool sets, model preferences, and processing pipelines.

---

## Core Entities (Data Model)

### User

Identity, preferences, theme settings, and API key storage for custom model providers. Users own projects and can be invited to collaborate on others.

### Project

The central organizing unit. Contains metadata (name, description, icon, visibility), settings (default model, embedding provider, tool configuration), a pointer to the project's root in object storage, and a reference to any active sandbox. Projects track creation time, last activity, and member roles.

### Source

An uploaded or linked document that serves as grounding material. Sources have a type (PDF, text, markdown, URL, image, audio, video, spreadsheet), processing status (pending, indexed, failed), extracted metadata, and chunk-level embeddings stored in a vector index. Sources are the "truth" that the AI grounds its responses in.

### Conversation

A sequence of messages within a project. A project can have multiple conversations (threads) — e.g., one for general Q&A, another for a specific sub-task. Conversations reference the project and track which sources and tools were used.

### Message

A single turn in a conversation — either user or agent. Messages carry structured annotations: citations (linking claims to source chunks), tool calls (code execution, file operations), file references, and status indicators. Agent messages may include rich content blocks (markdown, code, charts, audio).

### Artifact

A generated output that materializes as a file in the project. Types include: summary, report, timeline, mind map, study guide, FAQ, audio overview, code notebook, visualization, and custom plugin outputs. Artifacts are versioned and traceable back to the conversation turn and sources that produced them.

### Index

The vector/search index configuration for a project's sources. Tracks the embedding model, chunking strategy, refresh policy, and statistics (total chunks, coverage). Indexes are rebuilt when sources change.

### Sandbox

An ephemeral compute runtime associated with a project. Tracks the runtime identifier (container/VM ID), resource allocation, lifecycle state (starting, running, paused, terminated), and the set of tools/packages available.

### Entity Relationships

```text
User ──1:N──▶ Project
Project ──1:N──▶ Source
Project ──1:N──▶ Conversation
Project ──1:N──▶ Artifact
Project ──1:1──▶ Index
Project ──0:1──▶ Sandbox
Conversation ──1:N──▶ Message
Message ──N:N──▶ Source (citations)
Message ──0:N──▶ Artifact (generated)
Artifact ──N:N──▶ Source (derived from)
```

---

## Architecture

### Repository Structure

```text
openbooklm/
├── apps/
│   ├── web/                 # Next.js 16 frontend (UI, routes, components)
│   └── server/              # Hono + tRPC backend (API, auth, orchestration)
├── packages/
│   ├── api/                 # tRPC routers, procedures, business logic
│   ├── auth/                # Better Auth configuration & adapters
│   ├── db/                  # Drizzle ORM schema, migrations, queries
│   ├── env/                 # Environment variable validation (server + web)
│   ├── ui/                  # Shared shadcn/ui components and design tokens
│   └── config/              # Shared TypeScript configuration
├── PROJECT.md               # This document
├── AGENTS.md                # AI agent development instructions
└── README.md                # Getting started guide
```

### Technology Stack

| Layer       | Technology                  | Purpose                                     |
| ----------- | --------------------------- | ------------------------------------------- |
| Runtime     | Bun                         | Package manager, JS/TS runtime, test runner |
| Frontend    | Next.js 16 (App Router)     | SSR, RSC, routing, middleware               |
| Styling     | Tailwind CSS v4 + shadcn/ui | Design system, component library            |
| Backend     | Hono                        | Lightweight HTTP framework for API          |
| API Layer   | tRPC                        | End-to-end type-safe RPC                    |
| Auth        | Better Auth                 | Session management, OAuth, email/password   |
| Database    | Neon Serverless Postgres    | Primary data store via Drizzle ORM          |
| Monorepo    | Turborepo                   | Build orchestration, caching, task pipeline |
| Lint/Format | oxlint + oxfmt              | Fast linting and formatting                 |

### Frontend Route Map

```text
/                                             → Landing page (public)
/login                                        → Authentication (public)

/dashboard                                    → Projects overview
/dashboard/projects/new                       → Create new project
/dashboard/projects/[projectId]               → Project workspace overview
/dashboard/projects/[projectId]/sources       → Source document management
/dashboard/projects/[projectId]/chat          → AI conversation interface
/dashboard/projects/[projectId]/artifacts     → Generated artifact browser
/dashboard/projects/[projectId]/files         → Virtual file system explorer
/dashboard/projects/[projectId]/settings      → Project configuration
/dashboard/settings                           → User account & preferences
```

---

## Key Architectural Decisions

### Sources are not files — they are indexed, typed, first-class entities

Unlike a simple file upload, a Source carries processing state, chunk embeddings, extracted metadata, and provenance information. The virtual file system (in `/files`) presents sources alongside artifacts in a unified tree, but the underlying storage separates raw blobs, extracted text, and vector embeddings.

### Conversations are scoped to projects, not global

Each project maintains its own conversation threads. The agent's context window is populated from that project's sources and index. Cross-project queries are explicitly out of scope for V1 — this keeps the grounding contract simple and auditable.

### The sidebar adapts to navigation depth

At the dashboard level, the sidebar shows the project list and global navigation. Inside a project, the sidebar pivots to show project-specific navigation (Sources, Chat, Artifacts, Files, Settings). This is handled through nested layouts in Next.js App Router.

### Progressive complexity for sandboxes

V1 does not require full container orchestration. Start with server-side tool execution (e.g., running a Python snippet via a subprocess or WASM runtime). Graduate to per-project Docker containers or Firecracker microVMs as the platform matures.

### The chat interface is the primary — not the only — interaction surface

While the conversational control plane is the north star, users should never be forced to type commands for simple operations. Drag-and-drop upload, click-to-create, and direct file editing are all valid interactions that the agent can also observe and react to.

---

## V1 Scope

The first milestone focuses on the core loop: **create a project → upload sources → chat with grounded responses → generate artifacts**.

### In scope for V1:

- User authentication (email/password, Google OAuth)
- Project CRUD (create, list, rename, delete)
- Source upload and processing (PDF, text, markdown, URL)
- Source indexing with vector embeddings
- Conversational interface with source-grounded responses
- Citation annotations linking responses to source passages
- Basic artifact generation (summary, FAQ, study guide)
- Project-level settings (model selection, description)
- User settings (API keys, preferences)

### Deferred to V2+:

- Sandbox compute (code execution, data processing)
- Virtual file system with full CRUD
- Audio overview generation (podcast-style)
- Mind maps, timelines, and visual artifacts
- Collaboration (multi-user projects, sharing)
- Plugin/tool system
- Project templates
- Export and publish workflows

---

## Suggestions for Implementation

### Source Processing Pipeline

Source ingestion should be a multi-stage pipeline:

1. **Upload** — Raw file stored in object storage (S3-compatible or Neon blob)
2. **Extract** — Text extraction (PDF via pdf-parse, DOCX via mammoth, URL via readability)
3. **Chunk** — Split into semantically meaningful chunks (paragraph-aware, with overlap)
4. **Embed** — Generate vector embeddings via configurable provider
5. **Index** — Store chunks + embeddings in pgvector (Neon supports this natively)
6. **Ready** — Source marked as indexed, available for grounding

This pipeline should be idempotent and resumable — a failed extraction should not require re-upload.

### Retrieval-Augmented Generation (RAG)

The core Q&A flow:

1. User sends a message in a project conversation
2. System embeds the query and retrieves top-K relevant chunks from the project index
3. Retrieved chunks are injected into the LLM prompt as grounding context
4. The LLM generates a response with inline citation markers
5. Citations are resolved to source + chunk references and stored as message annotations
6. The response is streamed to the client with citation chips rendered inline

### Model Adapter Layer

Define a clean interface for LLM providers:

```typescript
interface ModelAdapter {
	chat(messages: Message[], options: ModelOptions): AsyncIterable<StreamChunk>;
	embed(texts: string[]): Promise<number[][]>;
	models(): Promise<ModelInfo[]>;
}
```

Implement adapters for OpenAI, Anthropic, Google, and Ollama. Users configure their preferred provider at the project or account level.

---

## Glossary

| Term             | Definition                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **Project**      | A workspace containing sources, conversations, artifacts, and configuration for a research task |
| **Source**       | An uploaded or linked document that provides grounding material for AI responses                |
| **Artifact**     | A generated output (summary, report, FAQ, mind map, etc.) derived from project sources          |
| **Grounding**    | The practice of constraining AI responses to information present in uploaded sources            |
| **Citation**     | A reference from an AI response back to a specific passage in a source document                 |
| **Index**        | The vector search index built from a project's source chunks and embeddings                     |
| **Sandbox**      | An isolated compute environment attached to a project for code execution and tool use           |
| **Conversation** | A chat thread within a project where the user interacts with the AI agent                       |

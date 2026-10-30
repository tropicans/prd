---
last_mapped_commit: 9612f8e17275bdcc6a161f5b288aa6f5610da0a6
last_mapped_at: 2026-10-30
---
<!-- refreshed: 2026-10-30 -->

# Architecture

**Analysis Date:** 2026-10-30

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
├──────────────────┬──────────────────┬───────────────────────┤
│    Next.js UI    │  PRD Wizard      │   Settings & Storage  │
│  `src/app/page`  │ `src/components` │ `src/lib/drafts.ts`   │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js API Route Handlers                  │
│  `src/app/api/generate`  `src/app/api/prefill`              │
│  `src/app/api/refine`    `src/app/api/models`               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LLM Gateway Layer                        │
│                 `src/app/api/_lib/llm-service.ts`           │
├──────────────────────────────┬──────────────────────────────┤
│    Google Gemini GenAI SDK   │  OpenAI-Compatible REST API  │
│    `@google/genai`           │  `fetch(/chat/completions)`  │
└──────────────────────────────┴──────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `Home` Page | Root client controller managing global states (provider, keys, active models, active step, modal visibility) | `src/app/page.tsx` |
| `PRDWizard` | Multi-step interactive flow (Idea Entry -> Auto-fill & Edit -> PRD Preview) | `src/components/prd-wizard.tsx` |
| `SettingsModal` | User configuration dialog for BYOK API keys, provider toggle (Gemini vs OpenAI-compatible), model selection, custom endpoints | `src/components/settings-modal.tsx` |
| `PRDDisplay` | Markdown preview, copy-to-clipboard, markdown download, section refinement triggers | `src/components/prd-display.tsx` |
| `SavedDraftsModal` | List, search, restore, and delete saved PRD drafts from client storage | `src/components/saved-drafts-modal.tsx` |
| `FullPagePRDViewer` | Immersive full-screen reading and editing mode for generated PRDs | `src/components/full-page-prd-viewer.tsx` |
| `ImageAttachment` | Uploading, previewing, and encoding visual mockups/screenshots | `src/components/image-attachment.tsx` |
| `MarkdownRenderer` | Styled neo-brutalist rendering of markdown headings, codeblocks, tables, and task lists | `src/components/markdown-renderer.tsx` |
| `llm-service` | Provider-agnostic gateway dispatching text and structured JSON prompts to Google GenAI or OpenAI-compatible backends | `src/app/api/_lib/llm-service.ts` |
| `drafts` | IndexedDB persistent storage repository with localStorage fallback | `src/lib/drafts.ts` |
| `prd` | PRD data model interfaces, defaults, prompt construction logic, and section field mappings | `src/lib/prd.ts` |
| `ingest` | Parser and analyzer for extracting project insights, file paths, and language distributions from uploaded context | `src/lib/ingest.ts` |

## Pattern Overview

**Overall:** Client-Centric Full-Stack Next.js Application with BYOK (Bring Your Own Key) Serverless Gateway

**Key Characteristics:**
- **Zero-Backend Persistence:** No central database or session store; all user inputs, drafts, and secrets reside entirely within the user's browser (IndexedDB and localStorage).
- **Stateless API Proxy:** Next.js Route Handlers act as secure proxies that receive client credentials per-call, inject system context, format prompts, and stream/return responses from LLM endpoints.
- **Neo-Brutalism Design System:** Distinctive high-contrast visual styling featuring sharp solid shadows (`shadow-[6px_6px_0px_#000]`), thick black borders (`border-[3px] border-black`), vibrant primary yellow (`#FFEB3B`), cyan, magenta, and punchy typography (`Big Shoulders Display` and `Inter`).
- **PWA-Enabled Offline First:** Service worker registered via `@ducanh2912/next-pwa` with dedicated offline fallback page (`src/app/offline/page.tsx`).

## Layers

**UI / Presentation Layer:**
- Purpose: Render client views, manage user input states, guide the PRD drafting wizard, and render formatted Markdown
- Location: `src/components/`, `src/app/page.tsx`
- Contains: React client components (`'use client'`), Radix UI dialog modals, Tailwind classes
- Depends on: `src/lib/` (types, drafts storage, PRD models)
- Used by: Browser end-users

**Client Library / Domain Layer:**
- Purpose: Data definitions, draft storage repository, client-side download utilities, prompt formatting
- Location: `src/lib/`
- Contains: TypeScript type definitions (`llm-types.ts`, `prd.ts`), IndexedDB adapter (`drafts.ts`), text ingestion (`ingest.ts`)
- Depends on: `idb`, native browser APIs
- Used by: `src/components/`, `src/app/page.tsx`, and Next.js route handlers

**API / Gateway Layer:**
- Purpose: Handle incoming HTTP requests from the frontend, construct AI prompts with time/date context, call LLM APIs
- Location: `src/app/api/`
- Contains: Next.js App Router route handlers (`generate/route.ts`, `prefill/route.ts`, `refine/route.ts`, `models/route.ts`), shared LLM service (`_lib/llm-service.ts`)
- Depends on: `@google/genai`, Next.js server runtime
- Used by: Client fetch requests from `PRDWizard`, `SettingsModal`, `RefineModal`

## Data Flow

### Primary Request Path: PRD Generation

1. User submits product idea in Step 1 of `PRDWizard` (`src/components/prd-wizard.tsx:93`)
2. Client calls `/api/prefill` with product idea, optional attached image metadata, API key, provider, and model (`src/components/prd-wizard.tsx:112`)
3. Route handler formats JSON prefill prompt, queries `callLLMJson` via `src/app/api/_lib/llm-service.ts`, returns structured `PrdInput` fields (`src/app/api/prefill/route.ts:53`)
4. User reviews and edits fields in Step 2 of `PRDWizard` (`src/components/prd-form.tsx`)
5. User clicks "Generate PRD" in Step 2; client calls `/api/generate` with complete `PrdInput` (`src/components/prd-wizard.tsx:165`)
6. Route handler builds prompt via `buildGenerationPrompt` (`src/lib/prd.ts`), calls `callLLMText`, returns full markdown PRD (`src/app/api/generate/route.ts:64`)
7. Step 3 displays the generated PRD in `PRDDisplay` (`src/components/prd-display.tsx`), auto-saves the draft to IndexedDB (`src/lib/drafts.ts:107`)

### Secondary Flow: Section Refinement

1. In Step 3, user highlights or chooses a section to refine and clicks "Refine Section" in `PRDDisplay` (`src/components/prd-display.tsx:180`)
2. `RefineModal` collects refinement feedback (`src/components/refine-modal.tsx`)
3. Client dispatches `POST /api/refine` with current inputs, section title, and feedback (`src/app/api/refine/route.ts:40`)
4. Route handler invokes `callLLMJson` to regenerate only the fields relevant to that section per `SECTION_FIELD_MAPPING` (`src/lib/prd.ts:41`)
5. Client merges updated fields and re-triggers PRD generation or directly updates section markdown

**State Management:**
- Root state in `src/app/page.tsx` using standard React `useState` and `useEffect`
- Persistence across sessions via browser `localStorage` (configuration) and `IndexedDB` (draft documents)

## Key Abstractions

**`LLMProvider`:**
- Purpose: Dispatches requests either to Google Gemini or an OpenAI-compatible endpoint
- Examples: `src/lib/llm-types.ts`, `src/app/api/_lib/llm-service.ts`
- Pattern: Strategy / Adapter pattern normalizing SDK calls vs REST calls

**`PrdInput`:**
- Purpose: Normalized schema representing the core sections of a PRD (product name, target audience, problem statement, solution, features, metrics, tech stack, constraints)
- Examples: `src/lib/prd.ts`
- Pattern: Data Transfer Object (DTO) & Form State Model

**`StoredDraft`:**
- Purpose: Record structure stored in IndexedDB representing historical PRD versions and snapshots
- Examples: `src/lib/drafts.ts`
- Pattern: Repository Entity

## Entry Points

**Web Application Entry:**
- Location: `src/app/layout.tsx` & `src/app/page.tsx`
- Triggers: User navigates to `http://localhost:3002/` or root URL
- Responsibilities: Loads fonts, registers Service Worker, reads persisted credentials, mounts top-level navigation, renders `PRDWizard`

**Offline Fallback Entry:**
- Location: `src/app/offline/page.tsx`
- Triggers: PWA service worker detects network disconnection while navigating
- Responsibilities: Renders offline banner, informs user that existing drafts are cached locally

**API Endpoints:**
- `/api/generate`: Generates full markdown PRD document (`src/app/api/generate/route.ts`)
- `/api/prefill`: Generates initial form fields from raw product idea (`src/app/api/prefill/route.ts`)
- `/api/refine`: Re-evaluates and updates specific PRD sections (`src/app/api/refine/route.ts`)
- `/api/models`: Queries available models from Gemini or custom provider (`src/app/api/models/route.ts`)

## Architectural Constraints

- **Client-Side Secret Storage:** Because there is no database or server authentication, API keys are passed from client to server per request. API routes must never log or persist these keys.
- **Node.js Server Runtime for API Routes:** The `@google/genai` SDK is executed on Node.js runtime (not Edge runtime) due to Node-specific dependencies.
- **Single Page Architecture:** The entire creation flow occurs on `/` with steps controlled by client state (`currentStep: 1 | 2 | 3`) rather than multi-page URL routes.

## Anti-Patterns

### Storing Sensitive API Keys in Server Environment for Multi-User Deployments

**What happens:** Hardcoding or relying solely on server `.env` `GEMINI_API_KEY` for all users.
**Why it's wrong:** Exhausts owner API quotas and presents billing vulnerabilities in public deployments.
**Do this instead:** Maintain the BYOK (Bring Your Own Key) pattern implemented in `src/components/settings-modal.tsx` and pass keys per request.

### Direct Client-Side LLM Calls Bypassing Route Handlers

**What happens:** Instantiating `@google/genai` or calling LLM APIs directly from client React components.
**Why it's wrong:** Causes CORS issues with third-party endpoints and leaks system prompt logic.
**Do this instead:** Route all LLM operations through `src/app/api/` handlers using `callLLMText` or `callLLMJson` in `src/app/api/_lib/llm-service.ts`.

## Error Handling

**Strategy:** Fail-soft with client notification banners and graceful fallbacks.

**Patterns:**
- Try/catch wrappers around all Next.js API route handlers returning `{ error: message }` with HTTP 400 (validation) or 500 (upstream error).
- Client-side error state capture (`setPrefillError`, `setGenerateError`) in `src/components/prd-wizard.tsx` displaying high-contrast warning boxes.
- IndexedDB fallback to `localStorage` if IndexedDB initialization fails or is blocked in private browsing (`src/lib/drafts.ts`).

## Cross-Cutting Concerns

**Logging:** Standard console output (`console.error`, `console.warn`) in server route handlers and client catch blocks.
**Validation:** Type-guard functions validating request bodies (`validateInputs` in `src/app/api/generate/route.ts`, `isPrdInput` in `src/app/api/refine/route.ts`).
**Styling:** Neo-Brutalism theme tokens declared in CSS variables and utility classes in `src/app/globals.css`.

---

*Architecture analysis: 2026-10-30*

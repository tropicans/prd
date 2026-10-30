---
last_mapped_commit: 9612f8e17275bdcc6a161f5b288aa6f5610da0a6
last_mapped_at: 2026-10-30
---
# Codebase Structure

**Analysis Date:** 2026-10-30

## Directory Layout

```
prd-creator/
├── .agents/                    # GSD orchestrator framework workflows and agents
├── .planning/                  # Project specifications, codebase maps, and state tracking
│   └── codebase/               # Mapped codebase documentation
├── public/                     # Static public assets (favicons, manifests, PWA icons)
├── specs/                      # Specification documents and mock PRD files
├── src/                        # Application source code
│   ├── app/                    # Next.js App Router (pages, layouts, and API routes)
│   │   ├── api/                # Server-side API route endpoints
│   │   │   ├── _lib/           # Server-side shared helpers (LLM gateway, datetime, Gemini client)
│   │   │   ├── generate/       # Full PRD generation route
│   │   │   ├── models/         # Dynamic LLM model fetching route
│   │   │   ├── prefill/        # Wizard field extraction from idea route
│   │   │   └── refine/         # Targeted section refinement route
│   │   ├── offline/            # PWA offline fallback page
│   │   ├── globals.css         # Global Neo-Brutalist stylesheet and Tailwind v4 definitions
│   │   ├── layout.tsx          # Root HTML layout and font loading
│   │   └── page.tsx            # Main application controller page
│   ├── components/             # Reusable React client components
│   │   ├── button.tsx          # Neo-brutalist button primitive with variants
│   │   ├── footer.tsx          # Application footer
│   │   ├── full-page-prd-viewer.tsx # Immersive PRD full-screen reader modal
│   │   ├── header.tsx          # Top navigation bar with action buttons
│   │   ├── image-attachment.tsx# Image upload and preview component
│   │   ├── input-field.tsx     # Form single-line input field primitive
│   │   ├── loader.tsx          # Spinning loader indicator
│   │   ├── markdown-renderer.tsx # Custom styled markdown rendering component
│   │   ├── prd-display.tsx     # PRD viewer, actions (copy, download, refine)
│   │   ├── prd-form.tsx        # Multi-section editable PRD form
│   │   ├── prd-wizard.tsx      # Main 3-step wizard workflow coordinator
│   │   ├── pwa-install-prompt.tsx # PWA installation banner
│   │   ├── refine-modal.tsx    # Modal for submitting section refinement feedback
│   │   ├── saved-drafts-modal.tsx # Modal for browsing and restoring drafts
│   │   ├── section.tsx         # Collapsible / boxed form section wrapper
│   │   ├── settings-modal.tsx  # API key and model selection configuration dialog
│   │   └── textarea-field.tsx  # Multi-line text area input primitive
│   ├── lib/                    # Shared client and server utility modules
│   │   ├── download.ts         # Client-side file blob download helper
│   │   ├── drafts.ts           # IndexedDB repository for saving and loading drafts
│   │   ├── ingest.ts           # Repository / document context ingestion parser
│   │   ├── llm-types.ts        # LLM provider and configuration type definitions
│   │   ├── models.ts           # Default static catalog of Gemini models
│   │   ├── prd.ts              # PRD data schemas, defaults, and prompt generators
│   │   └── prompt.ts           # Additional prompt templates and formatting helpers
│   └── types/                  # Ambient TypeScript type declarations
│       └── next-pwa.d.ts       # Type definitions for `@ducanh2912/next-pwa`
├── .editorconfig               # Editor whitespace and indent conventions
├── .gitignore                  # Git untracked pattern definitions
├── .prettierrc                 # Prettier code formatting rules
├── eslint.config.mjs           # ESLint 9 Flat Config
├── next.config.mjs             # Next.js and PWA build configuration
├── package.json                # Project dependencies, metadata, and npm scripts
├── postcss.config.mjs          # PostCSS configuration for Tailwind CSS v4
└── tsconfig.json               # TypeScript compiler configuration
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router root defining page routes, layouts, and serverless API handlers
- Contains: `layout.tsx`, `page.tsx`, `globals.css`, route subfolders (`api/`, `offline/`)
- Key files: `src/app/page.tsx`, `src/app/globals.css`

**`src/app/api/`:**
- Purpose: Serverless backend endpoints handling AI requests
- Contains: Route handlers (`route.ts`) and private shared logic (`_lib/`)
- Key files: `src/app/api/_lib/llm-service.ts`, `src/app/api/generate/route.ts`

**`src/components/`:**
- Purpose: UI presentation components and interactive dialogs
- Contains: Pure UI components, form inputs, dialogs, and feature-level components
- Key files: `src/components/prd-wizard.tsx`, `src/components/settings-modal.tsx`, `src/components/prd-display.tsx`

**`src/lib/`:**
- Purpose: Core domain types, storage logic, and helper functions
- Contains: Storage managers, LLM types, PRD interfaces
- Key files: `src/lib/drafts.ts`, `src/lib/prd.ts`, `src/lib/llm-types.ts`

**`specs/`:**
- Purpose: Specification documents, reference material, and sample PRD inputs/outputs
- Contains: Markdown specification files
- Key files: `specs/prd.md`, `specs/prompt-prd.md`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Main application landing page and client state manager
- `src/app/layout.tsx`: Root HTML layout wrapping fonts and metadata
- `src/app/api/generate/route.ts`: Core API entry point for PRD generation

**Configuration:**
- `next.config.mjs`: PWA configuration and Webpack setup
- `tsconfig.json`: TypeScript configuration and path aliases (`@/*`)
- `eslint.config.mjs`: ESLint flat configuration
- `.prettierrc`: Code style formatting rules

**Core Logic:**
- `src/app/api/_lib/llm-service.ts`: Abstraction for calling Gemini and OpenAI-compatible models
- `src/lib/drafts.ts`: Local draft persistence and retrieval using IndexedDB
- `src/lib/prd.ts`: PRD data structures and prompt engineering templates

## Naming Conventions

**Files:**
- Components: kebab-case with `.tsx` (e.g. `src/components/prd-wizard.tsx`, `src/components/settings-modal.tsx`)
- Utilities & Libraries: kebab-case with `.ts` (e.g. `src/lib/llm-types.ts`, `src/lib/drafts.ts`)
- Next.js App Router: Reserved Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`, `globals.css`)
- Server Private Libraries: Folder prefixed with underscore (`src/app/api/_lib/`)

**Directories:**
- Feature / Route folders: kebab-case or single lowercase words (e.g. `src/components`, `src/lib`, `src/app/offline`)

## Where to Add New Code

**New Feature (e.g. Export to Jira/Notion):**
- Primary client logic: `src/lib/export.ts` (export adapter logic)
- UI integration: Add action buttons in `src/components/prd-display.tsx`
- Modal/Dialog: Create `src/components/export-modal.tsx`

**New API Endpoint (e.g. PRD Validation / Scoring):**
- Route handler: `src/app/api/score/route.ts`
- Gateway calls: Reuse or extend `callLLMJson` in `src/app/api/_lib/llm-service.ts`

**New Reusable UI Primitive:**
- Place in `src/components/` following neo-brutalist style conventions (`border-[3px] border-black shadow-[...]`)

**New Utility Helper:**
- Place in `src/lib/` with strict TypeScript types and export functions

## Special Directories

**`.planning/`:**
- Purpose: GSD workflow state, codebase documentation, roadmap, and task tracking
- Generated: Maintained by GSD tools and agent runs
- Committed: Yes (tracked in version control for planning continuity)

**`.next/`:**
- Purpose: Next.js build cache and output artifacts
- Generated: Yes
- Committed: No (ignored via `.gitignore`)

---

*Structure analysis: 2026-10-30*

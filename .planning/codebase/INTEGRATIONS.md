---
last_mapped_commit: 9612f8e17275bdcc6a161f5b288aa6f5610da0a6
last_mapped_at: 2026-10-30
---
# External Integrations

**Analysis Date:** 2026-10-30

## APIs & External Services

**Google Gemini API:**
- Provider: Google Generative AI
- Purpose: Core LLM engine powering PRD prefill generation, section refinement, full PRD document creation, and model catalog discovery
- SDK/Client: `@google/genai` (^1.21.0) in `src/app/api/_lib/gemini-client.ts` and `src/app/api/_lib/llm-service.ts`
- Direct REST Endpoint: `https://generativelanguage.googleapis.com/v1beta/models?key=` used in `src/app/api/models/route.ts`
- Auth: Sent per-request from client request payload (stored in client `localStorage` as `gemini_api_key`), with server fallback to `GEMINI_API_KEY` or `GOOGLE_GEMINI_API_KEY`

**OpenAI-Compatible Custom LLM Endpoints:**
- Provider: Any OpenAI-compatible provider (e.g. self-hosted vLLM, Ollama, OpenRouter, Groq, custom proxy)
- Default Custom Endpoint: `https://sembilan.kelazz.my.id/v1` (`src/lib/llm-types.ts`)
- Endpoints consumed:
  - `${cleanUrl}/chat/completions` for text and structured JSON generation (`src/app/api/_lib/llm-service.ts`)
  - `${cleanUrl}/models` for dynamically listing available models (`src/app/api/models/route.ts`)
- Auth: Bearer token passed in the `Authorization: Bearer <apiKey>` HTTP header from client request payload (stored in `localStorage` as `custom_api_key`)

## Data Storage

**Databases:**
- Client-Side IndexedDB (`idb` v8.0.3)
  - Database name: `prd-creator-db`, Version: 1 (`src/lib/drafts.ts`)
  - Store: `drafts` with keyPath `id` and index `by-date` on `createdAt`
  - Purpose: Persistent offline storage for created PRD drafts, input wizard values, and attached image metadata
- Client-Side Web Storage (`localStorage` fallback)
  - Key: `prd-studio-drafts/v1` (fallback when IndexedDB is unavailable in browser)
  - Keys for application settings: `llm_provider`, `gemini_api_key`, `gemini_model`, `gemini_model_display_name`, `custom_api_key`, `custom_model`, `custom_model_display_name`, `custom_endpoint` (`src/app/page.tsx`, `src/components/settings-modal.tsx`)

**File Storage:**
- In-memory & Data URLs: Image attachments for PRD ideas are converted to Base64 data strings for previewing and API transmission (`src/components/image-attachment.tsx`, `src/components/prd-wizard.tsx`)
- Client-side export: Downloads generated PRD as Markdown (`.md`) file using browser Blob creation and dynamic anchor click (`src/lib/download.ts`)

**Caching:**
- Service Worker Workbox runtime cache (`next.config.mjs`):
  - `api-cache`: NetworkFirst strategy for `/api/.*` routes (max 50 entries, 24-hour expiration)
  - `image-cache`: CacheFirst strategy for images (`png`, `jpg`, `svg`, `webp`) (max 100 entries, 30 days)
  - `font-cache`: CacheFirst strategy for web fonts (`woff`, `woff2`, `ttf`) (max 50 entries, 1 year)

## Authentication & Identity

**Auth Provider:**
- Client-managed BYOK (Bring Your Own Key) architecture.
- No central user authentication, OAuth, or session database.
- Users input their own Gemini API key or custom OpenAI-compatible endpoint credentials. Keys are saved in the client's local browser storage and passed in the body of Next.js API requests.

## Monitoring & Observability

**Error Tracking:**
- None integrated (no Sentry, Datadog, or external error aggregator).
- Errors caught in API route handlers return structured JSON `{ error: string }` with HTTP 400/500 status codes (`src/app/api/generate/route.ts`).
- Client displays error banners in wizard steps and settings modals (`src/components/prd-wizard.tsx`, `src/components/settings-modal.tsx`).

**Logs:**
- Console logging only (`console.error`, `console.log`) in browser and server runtimes.

## CI/CD & Deployment

**Hosting:**
- Configured for Vercel, Node server, or containerized hosting with custom port 3002 default.

**CI Pipeline:**
- None detected in `.github/workflows` (no automated GitHub Actions CI currently active).

## Environment Configuration

**Required env vars (optional server defaults):**
- `GEMINI_API_KEY` - Optional server-side default API key for Gemini if client key is omitted in server calls (`src/app/api/_lib/gemini-client.ts`)
- `GOOGLE_GEMINI_API_KEY` - Alternate environment variable name for Gemini key
- `API_KEY` - Generic fallback environment variable name

**Secrets location:**
- Stored on client side in browser `localStorage`.
- No `.env` files committed to repository (guarded by `.gitignore`).

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-10-30*

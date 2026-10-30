---
last_mapped_commit: 9612f8e17275bdcc6a161f5b288aa6f5610da0a6
last_mapped_at: 2026-10-30
---
# Codebase Concerns

**Analysis Date:** 2026-10-30

## Tech Debt

**Component State Monoliths:**
- Issue: `PRDWizard` (`src/components/prd-wizard.tsx`, 546 lines) and `SettingsModal` (`src/components/settings-modal.tsx`, 498 lines) mix UI rendering, form state management, base64 file conversions, and multiple asynchronous network requests in single component files.
- Files: `src/components/prd-wizard.tsx`, `src/components/settings-modal.tsx`
- Impact: Difficult to unit-test isolated interactions; increases risk of regressions when modifying wizard steps or settings options.
- Fix approach: Extract custom hooks (e.g. `usePrdGeneration`, `useModelSettings`) and break down wizard steps into discrete child components.

**Duplicated Model Catalog Definitions:**
- Issue: Hardcoded model lists in `src/lib/models.ts` duplicate or conflict with dynamic model fetching in `src/app/api/models/route.ts`.
- Files: `src/lib/models.ts`, `src/app/api/models/route.ts`
- Impact: Hardcoded models quickly become stale as Google deprecates older Gemini preview checkpoints (e.g. `gemini-2.5-flash-preview-05-20`).
- Fix approach: Use dynamic API discovery as primary source with a clean, minimal static fallback.

## Known Bugs

**Multimodal Image Context Not Sent to Gemini API Parts:**
- Symptoms: When users attach product idea images in Step 1, Gemini receives only a text note (`img.name (${img.type}, ${size}MB)`) rather than the actual image bytes/base64 payload.
- Files: `src/app/api/prefill/route.ts`, `src/app/api/_lib/llm-service.ts`
- Trigger: Uploading mockups or wireframe screenshots during idea entry.
- Workaround: Users must describe the images in text.
- Fix approach: Update `callLLMJson` and `src/app/api/prefill/route.ts` to construct Gemini multimodal `inlineData` content parts (`{ inlineData: { mimeType, data } }`).

**Storage Quota Depletion on LocalStorage Fallback:**
- Symptoms: If IndexedDB fails or is unavailable in strict privacy/incognito modes, drafts fallback to `localStorage`. Storing full markdown documents with multiple drafts can exceed browser `localStorage` quota (typically 5MB).
- Files: `src/lib/drafts.ts`
- Trigger: Saving multiple large drafts in private browsing sessions.
- Workaround: Clear browser storage manually.
- Fix approach: Catch `QuotaExceededError` explicitly and evict the oldest draft with notification to the user.

## Security Considerations

**Client-Side API Key Storage in LocalStorage:**
- Risk: Storing raw Gemini and custom provider API keys in browser `localStorage` makes them accessible to any script running in the application context (XSS vulnerability).
- Files: `src/app/page.tsx`, `src/components/settings-modal.tsx`
- Current mitigation: No third-party analytics or untrusted CDN scripts are loaded.
- Recommendations: Consider session-only in-memory storage, or encrypt keys in client storage with a master passkey.

**Unauthenticated Server Route Handlers:**
- Risk: Route handlers (`/api/generate`, `/api/prefill`, `/api/refine`, `/api/models`) accept arbitrary API keys and target URLs (`baseUrl`). A malicious actor could use `/api/models` or `/api/generate` as an open SSRF proxy to probe internal network endpoints if deployed in an intranet environment.
- Files: `src/app/api/models/route.ts`, `src/app/api/_lib/llm-service.ts`
- Current mitigation: Basic URL trimming and error reporting.
- Recommendations: Restrict `baseUrl` to valid HTTPS schemes and validate domain names against an allowlist or private IP blocking filter.

## Performance Bottlenecks

**Uncompressed Image Attachments in Request Payloads:**
- Problem: Large image uploads (5MB+ PNGs or JPEGs) are read directly via `FileReader.readAsDataURL` and serialized into JSON payloads without client-side downscaling.
- Files: `src/components/image-attachment.tsx`, `src/components/prd-wizard.tsx`
- Cause: High-resolution images inflate JSON payload sizes, resulting in slow transfers and potential 413 Payload Too Large responses from hosting providers.
- Improvement path: Introduce canvas-based client-side image compression and resizing before encoding to base64.

## Fragile Areas

**Regular Expression JSON Extraction:**
- Files: `src/app/api/_lib/llm-service.ts:138` (`cleaned.match(/\{[\s\S]*\}/)`)
- Why fragile: If an LLM returns commentary containing curly braces before or after the JSON payload, greedy regex `/\{[\s\S]*\}/` captures non-JSON text, causing `JSON.parse` to fail.
- Safe modification: Use a robust streaming or balanced JSON parser, or strict JSON mode prompts.
- Test coverage: Zero unit test coverage for `extractJson` edge cases.

## Scaling Limits

**Draft Storage Limit:**
- Current capacity: Capped at 12 stored drafts (`MAX_DRAFTS = 12` in `src/lib/drafts.ts`).
- Limit: Older drafts are permanently overwritten without export prompts.
- Scaling path: Provide an explicit pagination or archive/export option before automated pruning.

## Dependencies at Risk

**`@ducanh2912/next-pwa`:**
- Risk: PWA library relies on custom Webpack plugin hooks (`next.config.mjs:59`). As Next.js migrates fully toward Turbopack as the default development and production bundler, Webpack-specific PWA plugins risk incompatibility.
- Impact: Future Next.js major version upgrades could break PWA generation.
- Migration plan: Monitor Turbopack PWA support or migrate to Serwist (`@serwist/next`).

## Missing Critical Features

**Automated Test Suite:**
- Problem: No automated tests exist for prompt generation, storage operations, or API route handlers.
- Blocks: Confident refactoring and CI/CD automation.

**Export Diversity:**
- Problem: The application only exports raw Markdown (`.md`).
- Blocks: Teams wanting direct integration into Jira, Confluence, Notion, or PDF formats.

## Test Coverage Gaps

**Prompt Building Logic:**
- What's not tested: `buildGenerationPrompt` and section mapping in `src/lib/prd.ts`
- Files: `src/lib/prd.ts`, `src/lib/prompt.ts`
- Risk: Formatting regressions or broken markdown syntax in generated PRDs
- Priority: High

**LLM Service Parsing & Error Fallbacks:**
- What's not tested: `extractJson`, OpenAI-compatible responses, and error handling in `src/app/api/_lib/llm-service.ts`
- Files: `src/app/api/_lib/llm-service.ts`
- Risk: Unhandled exceptions during generation when models return unexpected output formats
- Priority: High

**Draft Storage Operations:**
- What's not tested: IndexedDB saving, listing, deleting, and localStorage fallback in `src/lib/drafts.ts`
- Files: `src/lib/drafts.ts`
- Risk: Data loss of user drafts
- Priority: Medium

---

*Concerns audit: 2026-10-30*

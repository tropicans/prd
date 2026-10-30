---
last_mapped_commit: 9612f8e17275bdcc6a161f5b288aa6f5610da0a6
last_mapped_at: 2026-10-30
---
# Technology Stack

**Analysis Date:** 2026-10-30

## Languages

**Primary:**
- TypeScript 5.9.2 - Application codebase, Next.js app router pages, components, API route handlers, and utility libraries (`tsconfig.json`, `src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- JavaScript (ESNext / Node.js) - Next.js and toolchain configurations (`next.config.mjs`, `eslint.config.mjs`, `postcss.config.mjs`)
- CSS3 (Tailwind CSS v4) - Global theme variables and utility classes (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js >= 20.x (tested on Node.js v22.22.3)
- Browser: Modern evergreen browsers (Chrome, Edge, Firefox, Safari) with Web Storage, IndexedDB, and PWA Service Worker support

**Package Manager:**
- npm / pnpm (`package-lock.json` present)

## Frameworks

**Core:**
- Next.js 15.5.4 (App Router) - Full-stack React framework with server-side API routes and static asset optimization (`package.json`, `next.config.mjs`)
- React 19.1.1 - UI component rendering with React 19 hooks and client components (`package.json`)
- React DOM 19.1.1 - DOM renderer for React (`package.json`)

**Testing:**
- Not configured (No unit or E2E testing framework installed; see `TESTING.md` and `CONCERNS.md`)

**Build/Dev:**
- Webpack 5.102.0 - Bundler invoked through Next.js build pipeline (`next.config.mjs`)
- PostCSS with `@tailwindcss/postcss` 4.1.14 - CSS processing pipeline (`postcss.config.mjs`)
- Tailwind CSS 4.1.14 - Utility-first styling with neo-brutalist theme extensions (`src/app/globals.css`)
- `@ducanh2912/next-pwa` 10.2.9 - Progressive Web App plugin for Workbox service worker caching and offline navigation (`next.config.mjs`)
- Prettier 3.6.2 & `prettier-plugin-tailwindcss` 0.6.14 - Code formatter (`.prettierrc`)
- ESLint 9.x with `eslint-config-next` 15.5.4 - Linting and type-aware diagnostics (`eslint.config.mjs`)

## Key Dependencies

**Critical:**
- `@google/genai` ^1.21.0 - Official Google GenAI SDK used in server route handlers for Gemini LLM text generation and structured JSON extraction (`src/app/api/_lib/gemini-client.ts`, `src/app/api/_lib/llm-service.ts`)
- `idb` ^8.0.3 - Promise-based wrapper around IndexedDB for storing offline PRD drafts and attachments (`src/lib/drafts.ts`)
- `react-markdown` ^10.1.0 & `remark-gfm` ^4.0.0 - Markdown renderer for generated PRD documents supporting tables, tasklists, and headings (`src/components/markdown-renderer.tsx`)
- `lucide-react` ^0.544.0 - UI icons across header, wizard steps, buttons, and status indicators (`src/components/prd-wizard.tsx`, `src/components/header.tsx`)
- `@radix-ui/react-dialog` ^1.1.4 - Accessible modal primitives used for Settings, Saved Drafts, and Refine dialogs (`src/components/settings-modal.tsx`, `src/components/saved-drafts-modal.tsx`)
- `clsx` ^2.1.1 - Utility for conditional CSS class composition (`src/components/button.tsx`)

**Infrastructure:**
- `@types/node` ^24.6.0, `@types/react` 19.2.0, `@types/react-dom` ^19 - TypeScript type declarations (`package.json`)

## Configuration

**Environment:**
- Client-side credentials: API keys and custom LLM configurations are stored client-side in browser `localStorage` (`src/app/page.tsx`, `src/components/settings-modal.tsx`)
- Server-side environment fallback: `GEMINI_API_KEY`, `GOOGLE_GEMINI_API_KEY`, or `API_KEY` can be configured via environment variables for default fallback (`src/app/api/_lib/gemini-client.ts`)
- Next.js development server runs by default on port `3002` (`npm run dev` script in `package.json`)

**Build:**
- `next.config.mjs` - Configures PWA service worker with Workbox caching rules for `/api/.*`, image assets, and fonts
- `tsconfig.json` - Target `ES2017`, module resolution `bundler`, strict mode enabled, path alias `@/*` mapped to `./src/*`
- `postcss.config.mjs` - Integrates `@tailwindcss/postcss`
- `.prettierrc` - Single quotes, print width 80, no trailing commas, LF line endings, Tailwind plugin

## Platform Requirements

**Development:**
- Node.js 20+
- npm or pnpm

**Production:**
- Node.js server (standalone Next.js deployment) or Docker container, or Vercel edge/serverless deployment
- PWA deployment requires HTTPS for Service Worker registration (`src/components/pwa-install-prompt.tsx`)

---

*Stack analysis: 2026-10-30*

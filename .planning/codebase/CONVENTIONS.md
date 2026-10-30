---
last_mapped_commit: 9612f8e17275bdcc6a161f5b288aa6f5610da0a6
last_mapped_at: 2026-10-30
---
# Coding Conventions

**Analysis Date:** 2026-10-30

## Naming Patterns

**Files:**
- React components: kebab-case with `.tsx` extension: `src/components/prd-wizard.tsx`, `src/components/image-attachment.tsx`, `src/components/settings-modal.tsx`
- Utilities and modules: kebab-case with `.ts` extension: `src/lib/drafts.ts`, `src/lib/llm-types.ts`, `src/app/api/_lib/llm-service.ts`
- Next.js reserved files: lower case: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/api/generate/route.ts`

**Functions & Methods:**
- Functions and handlers: camelCase (e.g. `handleIdeaSubmit`, `validateInputs`, `callLLMText`, `generatePreviewMarkdown`)
- Component definitions: PascalCase (e.g. `export function PRDWizard(...)`, `export function Button(...)`, `export default function Home()`)
- Factory / Client getters: camelCase prefixed with `get` (e.g. `getGeminiClient()`, `getDB()`)

**Variables & Constants:**
- Local variables and state: camelCase (e.g. `currentStep`, `isPrefilling`, `productIdea`, `cleaned`)
- Module-level constants / Configuration defaults: UPPER_SNAKE_CASE (e.g. `DEFAULT_PRD_INPUT`, `DEFAULT_CUSTOM_ENDPOINT`, `SECTION_FIELD_MAPPING`, `STORAGE_KEY`)

**Types & Interfaces:**
- Interfaces and Type aliases: PascalCase (e.g. `PrdInput`, `StoredDraft`, `LLMProvider`, `CallLLMTextParams`, `PRDWizardProps`)
- Generics: Standard uppercase letters or descriptive PascalCase (e.g. `<T>`)

## Code Style

**Formatting:**
- Formatter: Prettier 3.6.2 configured via `.prettierrc`
- Indentation: 2 spaces (`tabWidth: 2`, `useTabs: false`)
- Line length: 80 characters (`printWidth: 80`)
- Quotes: Single quotes for TypeScript/JavaScript (`singleQuote: true`), double quotes for JSX (`jsxSingleQuote: false`)
- Semicolons: Always required (`semi: true`)
- Trailing commas: None (`trailingComma: "none"`)
- Bracket spacing: Enabled (`bracketSpacing: true`)
- Arrow function parameters: Always parenthesized (`arrowParens: "always"`)
- CSS Sorting: `prettier-plugin-tailwindcss` used to sort Tailwind class names automatically

**Linting:**
- Linter: ESLint 9 using Flat Config (`eslint.config.mjs`)
- Presets: `next/core-web-vitals`, `next/typescript`
- Custom overrides: `@next/next/no-img-element: "off"` allowed for base64 / blob image previews
- Ignores: `.next/**`, `node_modules/**`, `out/**`, `build/**`, `public/**`, `.agents/**`

## Import Organization

**Order:**
1. React and Next.js built-ins:
   ```typescript
   import React, { useState, useEffect } from 'react';
   import { NextRequest, NextResponse } from 'next/server';
   ```
2. External third-party packages:
   ```typescript
   import { GoogleGenAI, Type } from '@google/genai';
   import { Sparkles, Edit3 } from 'lucide-react';
   import { openDB } from 'idb';
   ```
3. Internal domain modules and path aliases (`@/*`):
   ```typescript
   import { PrdInput, DEFAULT_PRD_INPUT } from '@/lib/prd';
   import { LLMProvider } from '@/lib/llm-types';
   import { Button } from './button';
   ```

**Path Aliases:**
- Configured in `tsconfig.json`:
  ```json
  "paths": {
    "@/*": ["./src/*"]
  }
  ```
- Use `@/lib/...` and `@/components/...` for cross-directory imports; relative `./` is used for sibling files in the same directory.

## Error Handling

**Patterns:**
- **Server API Routes:** Wrap async logic in `try { ... } catch (error) { ... }`, extract message via `error instanceof Error ? error.message : '...'`, and return formatted JSON error response:
  ```typescript
  try {
    // business logic
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  ```
- **Type Guards for Body Validation:** Use explicit type-predicate functions to validate request payloads before processing (e.g. `validateInputs(value: unknown): value is PrdInput` in `src/app/api/generate/route.ts`).
- **Resilient JSON Parsing:** When LLM models return markdown-wrapped JSON or unstructured text, strip code fences and use regex fallback before failing:
  ```typescript
  const cleaned = extractJson(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T;
    throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}...`);
  }
  ```

## Logging

**Framework:** Native `console` methods (`console.error`, `console.warn`, `console.log`).

**Patterns:**
- Log detailed error stack traces and response failure details on the server console for debugging.
- Do NOT log sensitive user API keys, authorization tokens, or raw confidential input text.

## Comments

**When to Comment:**
- Section headers delineating major features or styles (e.g. `/* Neo-Brutalism Design System */` in `src/app/globals.css`).
- Complex prompt assembly logic or fallback explanations (e.g. fallback from IndexedDB to localStorage in `src/lib/drafts.ts`).

**JSDoc/TSDoc:**
- Used on public utility functions explaining parameter contracts and expected return values (e.g. `generatePreviewMarkdown` in `src/lib/prd.ts`).

---

*Conventions analysis: 2026-10-30*

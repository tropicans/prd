---
last_mapped_commit: 9612f8e17275bdcc6a161f5b288aa6f5610da0a6
last_mapped_at: 2026-10-30
---
# Testing Patterns

**Analysis Date:** 2026-10-30

## Test Framework

**Runner:**
- Currently not installed. No test runner (such as Jest or Vitest) is present in `package.json`.
- Config: None detected (`jest.config.*` and `vitest.config.*` absent).

**Assertion Library:**
- None installed.

**Run Commands:**

```bash

# Testing commands are currently absent from package.json scripts.

# Proposed commands upon framework setup:

npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run coverage report
```

## Test File Organization

**Location:**
- Proposed pattern: Co-located next to implementation files (e.g., `src/lib/__tests__/` or `src/lib/prd.test.ts`, `src/app/api/generate/route.test.ts`).

**Naming:**
- Standard Next.js / TypeScript convention: `*.test.ts`, `*.test.tsx`, `*.spec.ts`.

**Structure:**

```
src/
├── app/
│   └── api/
│       └── generate/
│           ├── route.ts
│           └── route.test.ts
├── components/
│   └── __tests__/
│       └── button.test.tsx
└── lib/
    └── __tests__/
        ├── drafts.test.ts
        └── prd.test.ts
```

## Test Structure

**Suite Organization (Recommended Pattern):**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePreviewMarkdown, DEFAULT_PRD_INPUT } from '@/lib/prd';

describe('generatePreviewMarkdown', () => {
  beforeEach(() => {
    // Setup state before each test
  });

  it('renders default product name when inputs are empty', () => {
    const markdown = generatePreviewMarkdown(DEFAULT_PRD_INPUT);
    expect(markdown).toContain('Product Name...');
  });

  it('includes provided product name in title header', () => {
    const markdown = generatePreviewMarkdown({
      ...DEFAULT_PRD_INPUT,
      productName: 'AI Flow Engine'
    });
    expect(markdown).toContain('# AI Flow Engine');
  });
});
```

## Mocking

**Framework:** Recommended: `vitest` (or `jest`) with `vi.mock` / `jest.mock`.

**Patterns:**

```typescript
// Mocking Google GenAI SDK for API route tests
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({ productName: 'Test Product' })
        })
      }
    })),
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' }
  };
});

// Mocking IndexedDB (idb)
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    getAllFromIndex: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue('draft-id'),
    delete: vi.fn().mockResolvedValue(undefined)
  })
}));
```

**What to Mock:**
- Network calls to Google Gemini API (`@google/genai`) and OpenAI-compatible endpoints (`global.fetch`).
- Browser storage APIs (`localStorage`, `IndexedDB` via `idb`).
- Window navigation and URL object creation (`URL.createObjectURL`, `URL.revokeObjectURL`).

**What NOT to Mock:**
- Pure helper functions (`src/lib/prd.ts`, `src/lib/prompt.ts`, `src/lib/ingest.ts`).
- Prompt building functions and string interpolation.
- Schema validation functions (`validateInputs`, `isPrdInput`).

## Fixtures and Factories

**Test Data:**

```typescript
export const mockPrdInput: PrdInput = {
  productName: 'Fleet Tracker',
  targetAudience: 'Logistics fleet managers',
  problemStatement: 'Unplanned vehicle breakdowns cost millions annually.',
  proposedSolution: 'Predictive telematics with real-time maintenance alerts.',
  coreFeatures: '- GPS Tracking\n- Telematics Diagnostics\n- Alert Dispatch',
  keyFeatures: '- Fuel efficiency analytics',
  businessGoals: 'Reduce maintenance downtime by 30%',
  successMetrics: 'Uptime > 99.5%, MTTR < 4 hours',
  futureFeatures: 'Autonomous dispatch integration',
  techStack: 'Next.js, Python, TimescaleDB',
  constraints: 'Must operate in low-bandwidth cellular zones',
  productIdeaImages: []
};
```

**Location:**
- Proposed: `src/test/fixtures/prd-fixtures.ts`

## Coverage

**Requirements:** None currently enforced.
**Recommended Target:** 70%+ statement coverage on `src/lib/` and core API route handlers.

## Test Types

**Unit Tests:**
- Prompt generation functions (`src/lib/prd.ts`)
- Storage adapter logic and fallbacks (`src/lib/drafts.ts`)
- Ingestion parsing and statistics calculation (`src/lib/ingest.ts`)

**Integration Tests:**
- API route handlers: `/api/generate`, `/api/prefill`, `/api/refine`, `/api/models` using mock LLM responses.

**E2E Tests:**
- Wizard user flow: entering an idea, editing prefilled fields, reviewing generated PRD, saving and loading drafts.
- Recommended framework: Playwright.

## Common Patterns

**Async Testing:**

```typescript
it('fetches models list for valid custom endpoint', async () => {
  const req = new Request('http://localhost:3002/api/models', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: 'test-key',
      provider: 'openai_compatible',
      baseUrl: 'https://test-endpoint.com/v1'
    })
  });
  // Execute and assert
});
```

**Error Testing:**

```typescript
it('returns 400 when apiKey is missing', async () => {
  const res = await POST(new NextRequest('http://localhost:3002/api/generate', {
    method: 'POST',
    body: JSON.stringify({ inputs: mockPrdInput })
  }));
  expect(res.status).toBe(400);
});
```

---

*Testing analysis: 2026-10-30*

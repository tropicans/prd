import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callLLMJson } from '../llm-service';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: (...args: unknown[]) => mockGenerateContent(...args)
      };
    },
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' }
  };
});

describe('callLLMJson parsing resilience', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('reproduces bug: fails when model returns valid JSON followed by extra commentary (Unexpected non-whitespace character after JSON)', async () => {
    // Large JSON payload followed by trailing text at position > 8000
    const longString = 'x'.repeat(8700);
    const mockModelResponse = `{"productName": "AwesomeApp", "description": "${longString}"} Here is extra notes from the model with braces {note}`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: mockModelResponse
            }
          }
        ]
      })
    } as unknown as Response);

    const result = await callLLMJson<{ productName: string }>({
      provider: 'openai_compatible',
      apiKey: 'test-key',
      baseUrl: 'https://sembilan.kelazz.my.id/v1',
      userPrompt: 'Analyze idea'
    });

    expect(result).toBeDefined();
    expect(result.productName).toBe('AwesomeApp');
  });

  it('reproduces bug: fails when reasoning model outputs <think> tags before markdown code fence with commentary after', async () => {
    const mockModelResponse = `<think>
I need to produce a PRD for the user.
Step 1: formulate product name.
Step 2: formulate problem statement.
</think>
Here is the JSON object:
\`\`\`json
{
  "productName": "PRD Studio",
  "problemStatement": "Writing PRDs is slow."
}
\`\`\`
Let me know if you need adjustments!`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: mockModelResponse
            }
          }
        ]
      })
    } as unknown as Response);

    const result = await callLLMJson<{ productName: string; problemStatement: string }>({
      provider: 'openai_compatible',
      apiKey: 'test-key',
      baseUrl: 'https://sembilan.kelazz.my.id/v1',
      userPrompt: 'Analyze idea'
    });

    expect(result).toBeDefined();
    expect(result.productName).toBe('PRD Studio');
    expect(result.problemStatement).toBe('Writing PRDs is slow.');
  });

  it('handles strings with escaped quotes and braces inside JSON values', async () => {
    const mockModelResponse = `Prefix commentary {"message": "Escaped \\"quote\\" and brace {here} inside value", "count": 42} Postfix note`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: mockModelResponse
            }
          }
        ]
      })
    } as unknown as Response);

    const result = await callLLMJson<{ message: string; count: number }>({
      provider: 'openai_compatible',
      apiKey: 'test-key',
      baseUrl: 'https://example.com/v1',
      userPrompt: 'Test prompt'
    });

    expect(result).toBeDefined();
    expect(result.message).toBe('Escaped "quote" and brace {here} inside value');
    expect(result.count).toBe(42);
  });

  it('handles array JSON schema with surrounding commentary', async () => {
    const mockModelResponse = `Here is your array of suggestions:
[
  {"id": 1, "title": "Feature A"},
  {"id": 2, "title": "Feature B"}
]
Hope this helps!`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: mockModelResponse
            }
          }
        ]
      })
    } as unknown as Response);

    const result = await callLLMJson<Array<{ id: number; title: string }>>({
      provider: 'openai_compatible',
      apiKey: 'test-key',
      baseUrl: 'https://example.com/v1',
      userPrompt: 'Get suggestions'
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Feature A');
  });

  it('skips invalid brace blocks before the real JSON object', async () => {
    const mockModelResponse = `Notes {see note below}: {"status": "success", "code": 200}`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: mockModelResponse
            }
          }
        ]
      })
    } as unknown as Response);

    const result = await callLLMJson<{ status: string; code: number }>({
      provider: 'openai_compatible',
      apiKey: 'test-key',
      baseUrl: 'https://example.com/v1',
      userPrompt: 'Status check'
    });

    expect(result.status).toBe('success');
    expect(result.code).toBe(200);
  });
});

describe('callLLMJson with Gemini provider', () => {
  it('parses Gemini responses containing markdown fences and trailing notes', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: '```json\n{"geminiOutput": "robust"}\n```\nExtra model notes'
    });

    const result = await callLLMJson<{ geminiOutput: string }>({
      provider: 'gemini',
      apiKey: 'test-gemini-key',
      userPrompt: 'Gemini prompt'
    });

    expect(result).toBeDefined();
    expect(result.geminiOutput).toBe('robust');
  });
});


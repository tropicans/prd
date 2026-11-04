import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callLLMText } from '../llm-service';

describe('callLLMText custom endpoint error handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('reproduces bug: should not expose raw HTML in error message when custom endpoint returns Cloudflare 524 timeout', async () => {
    const cloudflare524Html = `<!DOCTYPE html>
<html>
<head><title>kelazz.my.id | 524: A timeout occurred</title></head>
<body>
<div id="cf-wrapper">
  <h1>A timeout occurred</h1>
  <p>Error code 524</p>
  <p>The origin web server timed out responding to this request.</p>
</div>
</body>
</html>`;

    // Mock fetch returning Cloudflare 524 response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 524,
      statusText: '',
      text: async () => cloudflare524Html,
      json: async () => {
        throw new Error('Not JSON');
      }
    } as unknown as Response);

    // Call callLLMText
    await expect(
      callLLMText({
        provider: 'openai_compatible',
        apiKey: 'test-key',
        baseUrl: 'https://sembilan.kelazz.my.id/v1',
        userPrompt: 'Generate PRD'
      })
    ).rejects.toSatisfy((error: Error) => {
      const hasRawHtml = error.message.includes('<!DOCTYPE html>') || error.message.includes('<div id="cf-wrapper">');
      expect(hasRawHtml).toBe(false);
      expect(error.message).toMatch(/timeout|timed out|524/i);
      return true;
    });
  });

  it('should sanitize 502 Bad Gateway HTML response', async () => {
    const html502 = `<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: async () => html502,
      json: async () => {
        throw new Error('Not JSON');
      }
    } as unknown as Response);

    await expect(
      callLLMText({
        provider: 'openai_compatible',
        apiKey: 'test-key',
        baseUrl: 'https://sembilan.kelazz.my.id/v1',
        userPrompt: 'Generate PRD'
      })
    ).rejects.toSatisfy((error: Error) => {
      expect(error.message.includes('<html>')).toBe(false);
      expect(error.message).toMatch(/502|Bad Gateway/i);
      return true;
    });
  });

  it('should sanitize 504 Gateway Timeout HTML response', async () => {
    const html504 = `<html><head><title>504 Gateway Time-out</title></head><body><h1>504 Gateway Time-out</h1></body></html>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      statusText: 'Gateway Timeout',
      text: async () => html504,
      json: async () => {
        throw new Error('Not JSON');
      }
    } as unknown as Response);

    await expect(
      callLLMText({
        provider: 'openai_compatible',
        apiKey: 'test-key',
        baseUrl: 'https://sembilan.kelazz.my.id/v1',
        userPrompt: 'Generate PRD'
      })
    ).rejects.toSatisfy((error: Error) => {
      expect(error.message.includes('<html>')).toBe(false);
      expect(error.message).toMatch(/504|Gateway Timeout/i);
      return true;
    });
  });

  it('should extract title from other HTML error responses without leaking HTML tags', async () => {
    const html403 = `<!DOCTYPE html><html><head><title>Access Denied by WAF</title></head><body><p>Forbidden access</p></body></html>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => html403,
      json: async () => {
        throw new Error('Not JSON');
      }
    } as unknown as Response);

    await expect(
      callLLMText({
        provider: 'openai_compatible',
        apiKey: 'test-key',
        baseUrl: 'https://sembilan.kelazz.my.id/v1',
        userPrompt: 'Generate PRD'
      })
    ).rejects.toSatisfy((error: Error) => {
      expect(error.message).toContain('Access Denied by WAF');
      expect(error.message.includes('<')).toBe(false);
      return true;
    });
  });

  it('should throw readable error when request times out via AbortSignal', async () => {
    const timeoutError = new Error('The operation was aborted due to timeout');
    timeoutError.name = 'TimeoutError';

    global.fetch = vi.fn().mockRejectedValue(timeoutError);

    await expect(
      callLLMText({
        provider: 'openai_compatible',
        apiKey: 'test-key',
        baseUrl: 'https://sembilan.kelazz.my.id/v1',
        userPrompt: 'Generate PRD'
      })
    ).rejects.toThrow(/timed out after 120 seconds/i);
  });

  it('should preserve standard JSON error messages from provider', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ error: { message: 'Invalid model requested: gpt-nonexistent' } }),
      json: async () => ({ error: { message: 'Invalid model requested: gpt-nonexistent' } })
    } as unknown as Response);

    await expect(
      callLLMText({
        provider: 'openai_compatible',
        apiKey: 'test-key',
        baseUrl: 'https://sembilan.kelazz.my.id/v1',
        userPrompt: 'Generate PRD'
      })
    ).rejects.toThrow('Invalid model requested: gpt-nonexistent');
  });

  it('reproduces bug: should handle custom LLM HTTP response body containing trailing characters at position 8543 without throwing Unexpected non-whitespace character after JSON', async () => {
    // Large valid OpenAI chat completion response
    const longContent = 'A'.repeat(8500);
    const validJsonObj = {
      id: 'chatcmpl-test',
      choices: [
        {
          message: {
            content: `PRD Content: ${longContent}`
          }
        }
      ]
    };
    const responseWithTrailingData = JSON.stringify(validJsonObj) + '\n{"usage":{"total_tokens":500}}';

    // A real fetch Response that has trailing non-whitespace data after the first JSON object
    global.fetch = vi.fn().mockResolvedValue(new Response(responseWithTrailingData, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    const result = await callLLMText({
      provider: 'openai_compatible',
      apiKey: 'test-key',
      baseUrl: 'https://sembilan.kelazz.my.id/v1',
      userPrompt: 'Generate PRD'
    });

    expect(result).toBeDefined();
    expect(result).toContain('PRD Content:');
  });
});

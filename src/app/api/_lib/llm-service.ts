import { GoogleGenAI, Type } from '@google/genai';
import { LLMProvider, DEFAULT_CUSTOM_ENDPOINT } from '@/lib/llm-types';

interface CallLLMTextParams {
  provider?: LLMProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  systemPrompt?: string;
  userPrompt: string;
}

interface CallLLMJsonParams {
  provider?: LLMProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  systemPrompt?: string;
  userPrompt: string;
  geminiProperties?: Record<string, { type: Type.STRING }>;
  geminiRequired?: string[];
}

function cleanBaseUrl(url?: string): string {
  const base = (url || DEFAULT_CUSTOM_ENDPOINT).trim();
  return base.replace(/\/+$/, '');
}

function findBalancedBlock(text: string, startIndex: number): string | null {
  const openChar = text[startIndex];
  const closeChar = openChar === '{' ? '}' : (openChar === '[' ? ']' : null);
  if (!closeChar) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return text.slice(startIndex, i + 1);
        }
      }
    }
  }

  return null;
}

function extractJsonCandidateString(str: string): string | null {
  const trimmed = str.trim();
  if (!trimmed) return null;

  // 1. Direct parse attempt
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Continue to balanced extraction
  }

  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');

  // If '[' comes before '{' (and isn't just a footnote citation like [1]), search '[' first
  let searchChars: Array<'{' | '['> = ['{', '['];
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    searchChars = ['[', '{'];
  }

  for (const openChar of searchChars) {
    let startIndex = 0;
    while (startIndex < trimmed.length) {
      const nextOpen = trimmed.indexOf(openChar, startIndex);
      if (nextOpen === -1) break;

      const block = findBalancedBlock(trimmed, nextOpen);
      if (block) {
        // Skip obvious footnote citations like [1] when scanning brackets
        if (openChar === '[' && /^\s*\[\s*\d+\s*\]\s*$/.test(block)) {
          startIndex = nextOpen + 1;
          continue;
        }

        try {
          JSON.parse(block);
          return block;
        } catch {
          // Continue scanning for other blocks
        }
      }
      startIndex = nextOpen + 1;
    }
  }

  return null;
}

export function extractJson(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  // 1. Remove reasoning blocks like <think>...</think>
  const cleanedText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. If markdown code fences exist, extract content inside code fences
  const codeFenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let fenceMatch: RegExpExecArray | null;
  while ((fenceMatch = codeFenceRegex.exec(cleanedText)) !== null) {
    const candidate = extractJsonCandidateString(fenceMatch[1]);
    if (candidate !== null) {
      return candidate;
    }
  }

  // 3. Try parsing cleaned text directly or via balanced blocks
  const candidate = extractJsonCandidateString(cleanedText);
  if (candidate !== null) {
    return candidate;
  }

  return cleanedText;
}

export function robustExtractJson<T>(rawText: string): T {
  if (!rawText || !rawText.trim()) {
    throw new Error('LLM returned an empty response.');
  }

  const extracted = extractJson(rawText);
  try {
    return JSON.parse(extracted) as T;
  } catch {
    throw new Error(`Failed to parse JSON response from LLM: ${rawText.slice(0, 200)}...`);
  }
}

export async function callLLMText({
  provider = 'gemini',
  apiKey,
  model,
  baseUrl,
  systemPrompt,
  userPrompt
}: CallLLMTextParams): Promise<string> {
  if (provider === 'openai_compatible') {
    const endpoint = `${cleanBaseUrl(baseUrl)}/chat/completions`;
    const selectedModel = model || 'gpt-3.5-turbo';

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(120000)
      });
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('Custom LLM request timed out after 120 seconds. The server took too long to respond.');
      }
      throw err;
    }

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Custom LLM error (${response.status}): ${response.statusText || 'Server error'}`;

      const isHtml = /<!DOCTYPE|<html|<head/i.test(errText);

      if (isHtml) {
        if (response.status === 524) {
          errMsg = `Custom LLM error (524): Origin server timed out (Cloudflare Error 524). The server took too long to respond. Please retry, select a faster model, or switch provider.`;
        } else if (response.status === 502) {
          errMsg = `Custom LLM error (502): Bad Gateway. The custom endpoint upstream server failed to respond. Please check your endpoint provider or URL.`;
        } else if (response.status === 503) {
          errMsg = `Custom LLM error (503): Service Unavailable. The custom endpoint is temporarily overloaded or down for maintenance.`;
        } else if (response.status === 504) {
          errMsg = `Custom LLM error (504): Gateway Timeout. The gateway timed out waiting for the upstream server.`;
        } else {
          const titleMatch = errText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]?.trim()) {
            const cleanTitle = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            errMsg = `Custom LLM error (${response.status}): ${cleanTitle}`;
          } else {
            const stripped = errText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            errMsg = stripped
              ? `Custom LLM error (${response.status}): ${stripped.slice(0, 200)}`
              : `Custom LLM error (${response.status}): ${response.statusText || 'Server error'}`;
          }
        }
      } else {
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) {
            errMsg = parsed.error.message;
          } else if (parsed.error) {
            errMsg = String(parsed.error);
          }
        } catch {
          if (errText) {
            const sanitized = errText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (sanitized) errMsg += ` - ${sanitized}`;
          }
        }
      }

      // Final safeguard: strip any residual HTML tags
      errMsg = errMsg.replace(/<[^>]+>/g, '').trim();

      throw new Error(errMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('LLM returned an empty response.');
    }
    return content;
  }

  // Fallback / default: Google Gemini
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: model || 'gemini-flash-latest',
    contents: systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text;
}

export async function callLLMJson<T>({
  provider = 'gemini',
  apiKey,
  model,
  baseUrl,
  systemPrompt,
  userPrompt,
  geminiProperties,
  geminiRequired
}: CallLLMJsonParams): Promise<T> {
  if (provider === 'openai_compatible') {
    const fullSystemPrompt = `${systemPrompt || 'You are an expert AI assistant.'}\n\nIMPORTANT: You MUST respond ONLY with a raw, valid JSON object matching the requested schema. Do not wrap in markdown or backticks, do not include any explanatory text before or after the JSON.`;

    const text = await callLLMText({
      provider: 'openai_compatible',
      apiKey,
      model,
      baseUrl,
      systemPrompt: fullSystemPrompt,
      userPrompt
    });

    return robustExtractJson<T>(text);
  }

  // Google Gemini structured JSON
  const client = new GoogleGenAI({ apiKey });
  const fullContent = systemPrompt
    ? `${systemPrompt}\n\n${userPrompt}`
    : userPrompt;

  const response = await client.models.generateContent({
    model: model || 'gemini-flash-latest',
    contents: fullContent,
    config: {
      responseMimeType: 'application/json',
      responseSchema: geminiProperties
        ? {
            type: Type.OBJECT,
            properties: geminiProperties,
            required: geminiRequired
          }
        : undefined
    }
  });

  const jsonString = response.text?.trim();
  if (!jsonString) {
    throw new Error('Gemini returned an empty response.');
  }

  return robustExtractJson<T>(jsonString);
}

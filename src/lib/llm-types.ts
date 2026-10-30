export type LLMProvider = 'gemini' | 'openai_compatible';

export const DEFAULT_CUSTOM_ENDPOINT = 'https://sembilan.kelazz.my.id/v1';

export interface ModelOption {
  value: string;
  label: string;
  description: string;
  displayName?: string;
  inputTokenLimit?: number | null;
  outputTokenLimit?: number | null;
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  modelDisplayName?: string;
  baseUrl?: string;
}

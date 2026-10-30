'use client';

import React, { useState, useEffect } from 'react';
import { GEMINI_MODELS } from '@/lib/models';
import { Settings, Check, Server, Sparkles, RefreshCw } from 'lucide-react';
import { LLMProvider, DEFAULT_CUSTOM_ENDPOINT } from '@/lib/llm-types';

interface Model {
  value: string;
  label: string;
  description: string;
  displayName?: string;
  inputTokenLimit?: number | null;
  outputTokenLimit?: number | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    apiKey: string,
    model: string,
    modelDisplayName?: string,
    provider?: LLMProvider,
    baseUrl?: string
  ) => void;
  currentApiKey: string;
  currentModel: string;
  currentProvider?: LLMProvider;
  currentBaseUrl?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentApiKey,
  currentModel,
  currentProvider = 'gemini',
  currentBaseUrl = DEFAULT_CUSTOM_ENDPOINT
}: SettingsModalProps) {
  const [provider, setProvider] = useState<LLMProvider>(currentProvider);

  // Gemini state
  const [geminiApiKey, setGeminiApiKey] = useState(
    currentProvider === 'gemini' ? currentApiKey : ''
  );
  const [geminiModel, setGeminiModel] = useState(
    currentProvider === 'gemini' ? currentModel : 'gemini-flash-latest'
  );
  const [geminiModels, setGeminiModels] = useState<Model[]>(GEMINI_MODELS);
  const [loadingGeminiModels, setLoadingGeminiModels] = useState(false);
  const [geminiModelsError, setGeminiModelsError] = useState('');

  // Custom Endpoint state
  const [customEndpoint, setCustomEndpoint] = useState(
    currentBaseUrl || DEFAULT_CUSTOM_ENDPOINT
  );
  const [customApiKey, setCustomApiKey] = useState(
    currentProvider === 'openai_compatible' ? currentApiKey : ''
  );
  const [customModel, setCustomModel] = useState(
    currentProvider === 'openai_compatible' ? currentModel : ''
  );
  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [loadingCustomModels, setLoadingCustomModels] = useState(false);
  const [customModelsError, setCustomModelsError] = useState('');

  const [showApiKey, setShowApiKey] = useState(false);

  // Load stored settings on mount or modal open
  useEffect(() => {
    if (!isOpen) return;

    const storedProvider = (localStorage.getItem('llm_provider') as LLMProvider) || currentProvider || 'gemini';
    setProvider(storedProvider);

    const savedGeminiKey = localStorage.getItem('gemini_api_key') || (storedProvider === 'gemini' ? currentApiKey : '');
    const savedGeminiModel = localStorage.getItem('gemini_model') || (storedProvider === 'gemini' ? currentModel : 'gemini-flash-latest');
    setGeminiApiKey(savedGeminiKey);
    setGeminiModel(savedGeminiModel);

    const savedCustomEndpoint = localStorage.getItem('custom_endpoint') || currentBaseUrl || DEFAULT_CUSTOM_ENDPOINT;
    const savedCustomKey = localStorage.getItem('custom_api_key') || (storedProvider === 'openai_compatible' ? currentApiKey : '');
    const savedCustomModel = localStorage.getItem('custom_model') || (storedProvider === 'openai_compatible' ? currentModel : '');

    setCustomEndpoint(savedCustomEndpoint);
    setCustomApiKey(savedCustomKey);
    setCustomModel(savedCustomModel);

    if (storedProvider === 'gemini' && savedGeminiKey && savedGeminiKey.trim().length > 20) {
      fetchGeminiModels(savedGeminiKey);
    } else if (storedProvider === 'openai_compatible' && savedCustomKey && savedCustomEndpoint) {
      fetchCustomModels(savedCustomKey, savedCustomEndpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchGeminiModels = async (key: string) => {
    setLoadingGeminiModels(true);
    setGeminiModelsError('');

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider: 'gemini' })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Gemini models');
      }

      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setGeminiModels(data.models);
        if (!data.models.find((m: Model) => m.value === geminiModel)) {
          setGeminiModel(data.models[0].value);
        }
      }
    } catch {
      setGeminiModelsError('Could not fetch models. Using default list.');
      setGeminiModels(GEMINI_MODELS);
    } finally {
      setLoadingGeminiModels(false);
    }
  };

  const fetchCustomModels = async (key: string, endpoint: string) => {
    if (!key || !endpoint) return;
    setLoadingCustomModels(true);
    setCustomModelsError('');

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          provider: 'openai_compatible',
          baseUrl: endpoint
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to fetch models from custom endpoint');
      }

      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setCustomModels(data.models);
        if (!customModel || !data.models.find((m: Model) => m.value === customModel)) {
          setCustomModel(data.models[0].value);
        }
      } else {
        setCustomModelsError('No models found in the endpoint response.');
      }
    } catch (err) {
      setCustomModelsError(
        err instanceof Error ? err.message : 'Error connecting to custom endpoint.'
      );
    } finally {
      setLoadingCustomModels(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('llm_provider', provider);

    if (provider === 'gemini') {
      if (!geminiApiKey.trim()) return;

      const selectedModelData = geminiModels.find((m) => m.value === geminiModel);
      const displayName =
        selectedModelData?.displayName || selectedModelData?.label || geminiModel;

      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
      localStorage.setItem('gemini_model', geminiModel);
      localStorage.setItem('gemini_model_display_name', displayName);

      onSave(
        geminiApiKey.trim(),
        geminiModel,
        displayName,
        'gemini'
      );
    } else {
      if (!customApiKey.trim()) return;

      const modelName = customModel.trim() || 'default';
      const selectedModelData = customModels.find((m) => m.value === modelName);
      const displayName =
        selectedModelData?.displayName || selectedModelData?.label || modelName;

      localStorage.setItem('custom_endpoint', customEndpoint.trim());
      localStorage.setItem('custom_api_key', customApiKey.trim());
      localStorage.setItem('custom_model', modelName);
      localStorage.setItem('custom_model_display_name', displayName);

      onSave(
        customApiKey.trim(),
        modelName,
        displayName,
        'openai_compatible',
        customEndpoint.trim()
      );
    }

    onClose();
  };

  const isSaveDisabled =
    provider === 'gemini'
      ? !geminiApiKey.trim()
      : !customApiKey.trim() || !customEndpoint.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-[5px] border-black bg-white shadow-[12px_12px_0px_#000]">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b-[3px] border-black pb-4">
            <h2
              className="text-3xl font-black tracking-tight text-black uppercase"
              style={{
                fontFamily:
                  "'Big Shoulders Display', 'Impact', 'Arial Black', sans-serif"
              }}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                LLM & API SETTINGS
              </span>
            </h2>
            <button
              onClick={onClose}
              className="border-[3px] border-black p-2 text-black transition-all duration-150 hover:bg-[#F44336] hover:text-white"
              aria-label="Close"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Provider Selector Tabs */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold tracking-wide text-black uppercase">
              Select Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`flex items-center justify-center gap-2 border-[3px] border-black p-3 font-bold uppercase transition-all duration-150 ${
                  provider === 'gemini'
                    ? 'bg-[#FFEB3B] text-black shadow-[4px_4px_0px_#000]'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="h-5 w-5" />
                Google Gemini
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai_compatible')}
                className={`flex items-center justify-center gap-2 border-[3px] border-black p-3 font-bold uppercase transition-all duration-150 ${
                  provider === 'openai_compatible'
                    ? 'bg-[#00E676] text-black shadow-[4px_4px_0px_#000]'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Server className="h-5 w-5" />
                Custom Endpoint
              </button>
            </div>
          </div>

          {/* GOOGLE GEMINI TAB */}
          {provider === 'gemini' && (
            <div className="mb-8 space-y-6">
              <div>
                <label
                  htmlFor="geminiApiKey"
                  className="mb-2 block text-sm font-bold tracking-wide text-black uppercase"
                >
                  Gemini API Key <span className="text-[#E91E63]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    id="geminiApiKey"
                    value={geminiApiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGeminiApiKey(val);
                      if (val.trim().length > 20) {
                        fetchGeminiModels(val);
                      }
                    }}
                    placeholder="Enter your Gemini API key"
                    className="w-full border-[3px] border-black bg-white px-4 py-3 pr-24 font-medium text-black placeholder-gray-500 shadow-[4px_4px_0px_#000] focus:border-[#2196F3] focus:shadow-[4px_4px_0px_#2196F3] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 border-[2px] border-black bg-[#FFEB3B] px-3 py-1 text-xs font-bold uppercase transition-colors hover:bg-[#FDD835]"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="mt-2 text-xs font-medium text-gray-700">
                  Get your free API key from{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#2196F3] underline hover:text-[#1976D2]"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              {/* Gemini Model Selection */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="geminiModel"
                    className="block text-sm font-bold tracking-wide text-black uppercase"
                  >
                    Model Selection
                  </label>
                  {loadingGeminiModels && (
                    <span className="flex items-center text-xs font-bold text-[#2196F3] uppercase">
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      Fetching...
                    </span>
                  )}
                  {!loadingGeminiModels && geminiModels.length > 0 && (
                    <span className="text-xs font-bold text-[#4CAF50] uppercase">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {geminiModels.length} LOADED
                      </span>
                    </span>
                  )}
                </div>

                {geminiModelsError && (
                  <div className="mb-2 border-[2px] border-black bg-[#FF9800] px-3 py-1 text-xs font-bold text-black">
                    {geminiModelsError}
                  </div>
                )}

                <select
                  id="geminiModel"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  disabled={loadingGeminiModels}
                  className="w-full border-[3px] border-black bg-white px-4 py-3 font-medium text-black shadow-[4px_4px_0px_#000] focus:border-[#2196F3] focus:shadow-[4px_4px_0px_#2196F3] focus:outline-none disabled:opacity-50"
                >
                  {geminiModels.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.displayName || opt.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs font-medium text-gray-600">
                  {geminiModels.find((m) => m.value === geminiModel)?.description}
                </p>
              </div>
            </div>
          )}

          {/* CUSTOM ENDPOINT TAB */}
          {provider === 'openai_compatible' && (
            <div className="mb-8 space-y-6">
              {/* Endpoint URL */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="customEndpoint"
                    className="block text-sm font-bold tracking-wide text-black uppercase"
                  >
                    API Endpoint (Base URL) <span className="text-[#E91E63]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomEndpoint(DEFAULT_CUSTOM_ENDPOINT)}
                    className="text-xs font-bold text-[#2196F3] underline hover:text-[#1976D2]"
                  >
                    Reset to default
                  </button>
                </div>
                <input
                  type="text"
                  id="customEndpoint"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="https://sembilan.kelazz.my.id/v1"
                  className="w-full border-[3px] border-black bg-white px-4 py-3 font-medium text-black placeholder-gray-400 shadow-[4px_4px_0px_#000] focus:border-[#00E676] focus:shadow-[4px_4px_0px_#00E676] focus:outline-none"
                />
                <p className="mt-1 text-xs font-medium text-gray-600">
                  Format endpoint OpenAI-compatible (contoh: <code>https://sembilan.kelazz.my.id/v1</code>).
                </p>
              </div>

              {/* API Key */}
              <div>
                <label
                  htmlFor="customApiKey"
                  className="mb-2 block text-sm font-bold tracking-wide text-black uppercase"
                >
                  API Key <span className="text-[#E91E63]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    id="customApiKey"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Masukkan API Key untuk endpoint ini"
                    className="w-full border-[3px] border-black bg-white px-4 py-3 pr-24 font-medium text-black placeholder-gray-500 shadow-[4px_4px_0px_#000] focus:border-[#00E676] focus:shadow-[4px_4px_0px_#00E676] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 border-[2px] border-black bg-[#FFEB3B] px-3 py-1 text-xs font-bold uppercase transition-colors hover:bg-[#FDD835]"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Model Name & Fetch */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="customModel"
                    className="block text-sm font-bold tracking-wide text-black uppercase"
                  >
                    Model Name <span className="text-[#E91E63]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchCustomModels(customApiKey, customEndpoint)}
                    disabled={loadingCustomModels || !customApiKey.trim()}
                    className="flex items-center gap-1 border-[2px] border-black bg-[#00E676] px-2 py-1 text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-[#00c853] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${loadingCustomModels ? 'animate-spin' : ''}`}
                    />
                    Fetch Models
                  </button>
                </div>

                {customModelsError && (
                  <div className="mb-2 border-[2px] border-black bg-[#FF9800] px-3 py-1 text-xs font-bold text-black">
                    {customModelsError}
                  </div>
                )}

                {customModels.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      id="customModelSelect"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full border-[3px] border-black bg-white px-4 py-3 font-medium text-black shadow-[4px_4px_0px_#000] focus:border-[#00E676] focus:shadow-[4px_4px_0px_#00E676] focus:outline-none"
                    >
                      {customModels.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="Atau ketik nama model secara manual"
                      className="w-full border-[2px] border-dashed border-black bg-gray-50 px-3 py-2 text-xs font-medium text-black"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    id="customModel"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="Contoh: llama3, qwen2.5, deepseek-chat, gpt-4o"
                    className="w-full border-[3px] border-black bg-white px-4 py-3 font-medium text-black placeholder-gray-400 shadow-[4px_4px_0px_#000] focus:border-[#00E676] focus:shadow-[4px_4px_0px_#00E676] focus:outline-none"
                  />
                )}
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Klik <strong>Fetch Models</strong> untuk memuat daftar model yang aktif di endpoint, atau ketik langsung nama model yang didukung.
                </p>
              </div>

              {/* Info Box */}
              <div className="border-[3px] border-black bg-[#00E676]/20 p-4 shadow-[4px_4px_0px_#000]">
                <p className="text-xs font-bold text-black">
                  Endpoint ini akan dihubungi dengan standar OpenAI Chat Completions API (<code>/v1/chat/completions</code>).
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 border-t-[3px] border-black pt-6">
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="flex-1 border-[3px] border-black bg-[#FFEB3B] px-6 py-3 font-bold tracking-wide text-black uppercase shadow-[4px_4px_0px_#000] transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-[4px_4px_0px_#000]"
            >
              Save Settings
            </button>
            <button
              onClick={onClose}
              className="border-[3px] border-black bg-white px-6 py-3 font-bold tracking-wide text-black uppercase shadow-[4px_4px_0px_#000] transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

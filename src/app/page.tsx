'use client';

import React, { useState, useEffect } from 'react';
import { PrdInput, DEFAULT_PRD_INPUT } from '@/lib/prd';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PRDWizard } from '@/components/prd-wizard';
import { FullPagePRDViewer } from '@/components/full-page-prd-viewer';
import { SettingsModal } from '@/components/settings-modal';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { SavedDraftsModal } from '@/components/saved-drafts-modal';
import { StoredDraft } from '@/lib/drafts';
import { LLMProvider, DEFAULT_CUSTOM_ENDPOINT } from '@/lib/llm-types';

export default function Home() {
  // Settings state
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [baseUrl, setBaseUrl] = useState<string>(DEFAULT_CUSTOM_ENDPOINT);
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(
    'gemini-flash-latest'
  );
  const [modelDisplayName, setModelDisplayName] =
    useState<string>('Gemini 2.5 Flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState<boolean>(false);
  const [isSavedDraftsOpen, setIsSavedDraftsOpen] = useState<boolean>(false);
  const [isFullPageViewOpen, setIsFullPageViewOpen] = useState<boolean>(false);

  const [prdInput, setPrdInput] = useState<PrdInput>(DEFAULT_PRD_INPUT);
  const [generatedPrd, setGeneratedPrd] = useState<string>('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedProvider =
      (localStorage.getItem('llm_provider') as LLMProvider) || 'gemini';
    setProvider(storedProvider);

    if (storedProvider === 'openai_compatible') {
      const customKey = localStorage.getItem('custom_api_key') || '';
      const customModel = localStorage.getItem('custom_model') || '';
      const customModelName =
        localStorage.getItem('custom_model_display_name') ||
        customModel ||
        'Custom Model';
      const customEp =
        localStorage.getItem('custom_endpoint') || DEFAULT_CUSTOM_ENDPOINT;

      setBaseUrl(customEp);
      setApiKey(customKey);
      setSelectedModel(customModel);
      setModelDisplayName(customModelName);
      if (!customKey) {
        setShowSetupPrompt(true);
      }
    } else {
      const storedApiKey = localStorage.getItem('gemini_api_key') || '';
      const storedModel =
        localStorage.getItem('gemini_model') || 'gemini-flash-latest';
      const storedModelDisplayName =
        localStorage.getItem('gemini_model_display_name') || 'Gemini 2.5 Flash';

      setApiKey(storedApiKey);
      setSelectedModel(storedModel);
      setModelDisplayName(storedModelDisplayName);

      if (!storedApiKey) {
        setShowSetupPrompt(true);
      }
    }
  }, []);

  const handleSaveSettings = (
    newApiKey: string,
    newModel: string,
    newModelDisplayName?: string,
    newProvider: LLMProvider = 'gemini',
    newBaseUrl?: string
  ) => {
    setProvider(newProvider);
    if (newBaseUrl) setBaseUrl(newBaseUrl);
    setApiKey(newApiKey);
    setSelectedModel(newModel);
    setModelDisplayName(newModelDisplayName || newModel);
    setIsSettingsOpen(false);
    setShowSetupPrompt(false);
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const handleLoadDraft = (draft: StoredDraft) => {
    setPrdInput(draft.inputs);
    setGeneratedPrd(draft.markdown);
    setSelectedModel(draft.model);
    setCurrentStep(3); // Switch to step 3 to show the loaded PRD
  };

  const handleResetState = () => {
    setPrdInput(DEFAULT_PRD_INPUT);
    setGeneratedPrd('');
    setCurrentStep(1);
  };

  const handleFullPageView = () => {
    setIsFullPageViewOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <Header
        onSettingsClick={() => setIsSettingsOpen(true)}
        onSavedDraftsClick={() => setIsSavedDraftsOpen(true)}
      />

      <main className="container mx-auto min-h-0 flex-grow px-4 py-4">
        <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col">
          {/* Setup Prompt Banner */}
          {showSetupPrompt && (
            <div className="mb-6 border-[3px] border-black bg-[#FFEB3B] p-6 shadow-[6px_6px_0px_#000]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center">
                  <svg
                    className="mr-4 h-8 w-8 flex-shrink-0 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="mb-1 text-lg font-bold tracking-wide text-black uppercase">
                      Setup Required
                    </h3>
                    <p className="font-medium text-black">
                      Configure your API key to start generating PRDs
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center border-[2px] border-black bg-white px-4 py-2 font-bold tracking-wide text-black uppercase shadow-[2px_2px_0px_#000] transition-all duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] focus:outline-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000]"
                >
                  Configure API Key
                </button>
              </div>
            </div>
          )}

          {/* Main Content - Wizard Only */}
          <div className="mx-auto max-w-6xl">
            <PRDWizard
              apiKey={apiKey}
              selectedModel={selectedModel}
              modelDisplayName={modelDisplayName}
              provider={provider}
              baseUrl={baseUrl}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              generatedPrd={generatedPrd}
              prdInput={prdInput}
              onGeneratedPRD={(prd, inputs) => {
                setGeneratedPrd(prd);
                setPrdInput(inputs);
              }}
              onFullPageView={handleFullPageView}
              onResetState={handleResetState}
            />
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentApiKey={apiKey}
        currentModel={selectedModel}
        currentProvider={provider}
        currentBaseUrl={baseUrl}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Saved Drafts Modal */}
      <SavedDraftsModal
        isOpen={isSavedDraftsOpen}
        onClose={() => setIsSavedDraftsOpen(false)}
        onLoadDraft={handleLoadDraft}
      />

      {/* Full Page PRD Viewer */}
      <FullPagePRDViewer
        isOpen={isFullPageViewOpen}
        onClose={() => setIsFullPageViewOpen(false)}
        content={generatedPrd}
        productName={prdInput.productName || 'PRD'}
        model={selectedModel}
      />
    </div>
  );
}

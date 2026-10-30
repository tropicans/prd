import { NextRequest, NextResponse } from 'next/server';
import { buildGenerationPrompt, PrdInput } from '../../../lib/prd';
import { getContextHeader } from '../_lib/datetime';
import { callLLMText } from '../_lib/llm-service';
import { LLMProvider } from '@/lib/llm-types';

function validateInputs(value: unknown): value is PrdInput {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const input = value as Record<keyof PrdInput, unknown>;

  // Check string fields
  const stringFields: Array<keyof PrdInput> = [
    'productName',
    'targetAudience',
    'problemStatement',
    'proposedSolution',
    'coreFeatures',
    'keyFeatures',
    'businessGoals',
    'successMetrics',
    'futureFeatures',
    'techStack',
    'constraints'
  ];

  const stringFieldsValid = stringFields.every(
    (field) => typeof input[field] === 'string'
  );

  // Check productIdeaImages field (optional)
  const imagesValid =
    !input.productIdeaImages || Array.isArray(input.productIdeaImages);

  return stringFieldsValid && imagesValid;
}

export async function POST(request: NextRequest) {
  try {
    const { inputs, apiKey, model, provider, baseUrl } =
      (await request.json()) as {
        inputs?: unknown;
        apiKey?: string;
        model?: string;
        provider?: LLMProvider;
        baseUrl?: string;
      };

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required.' },
        { status: 400 }
      );
    }

    if (!validateInputs(inputs)) {
      return NextResponse.json(
        { error: 'Invalid PRD inputs provided.' },
        { status: 400 }
      );
    }

    const basePrompt = buildGenerationPrompt(inputs);
    const promptWithContext = getContextHeader() + basePrompt;

    const text = await callLLMText({
      provider,
      apiKey,
      model,
      baseUrl,
      systemPrompt:
        'You are an expert product manager and technical writer who generates comprehensive, professional, well-structured Product Requirements Documents (PRDs).',
      userPrompt: promptWithContext
    });

    return NextResponse.json({ data: { prd: text } });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while generating the PRD.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { DEFAULT_PRD_INPUT, PrdInput } from '../../../lib/prd';
import { getContextHeader } from '../_lib/datetime';
import { callLLMJson } from '../_lib/llm-service';
import { LLMProvider } from '@/lib/llm-types';

export async function POST(request: NextRequest) {
  try {
    const { productIdea, images, apiKey, model, provider, baseUrl } =
      (await request.json()) as {
        productIdea?: string;
        images?: Array<{
          id: string;
          name: string;
          type: string;
          size: number;
          data: string;
        }>;
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

    if (!productIdea || !productIdea.trim()) {
      return NextResponse.json(
        { error: 'Product idea is required.' },
        { status: 400 }
      );
    }

    // Build image context if images are provided
    let imageContext = '';
    if (images && images.length > 0) {
      imageContext =
        '\n\nVisual Context: The user has also provided the following images to help illustrate their product idea:\n';
      images.forEach((img, index) => {
        imageContext += `\n${index + 1}. Image: ${img.name} (${img.type}, ${(img.size / 1024 / 1024).toFixed(1)}MB)\n`;
        imageContext += `   [Note: This is a base64 encoded image that provides visual context for the product idea]`;
      });
      imageContext +=
        "\n\nPlease consider these visual materials when analyzing the product idea. They may contain mockups, wireframes, diagrams, or reference photos that provide additional context about the user's vision.";
    }

    const basePrompt = `You are a brilliant product strategist. A user has provided a high-level product idea. Your task is to analyze this idea and break it down into the foundational components of a Product Requirements Document. Based on the idea, generate a plausible product name, identify a specific target audience, formulate a clear problem statement and a corresponding solution, brainstorm core features for an MVP, identify key differentiating features, suggest business goals and specific success metrics (KPIs), and recommend future features and tech stack.

User's Idea: "${productIdea}"${imageContext}

Return the response as a JSON object that strictly adheres to the requested fields:
- productName
- targetAudience
- problemStatement
- proposedSolution
- coreFeatures (use bullet points within string)
- keyFeatures (use bullet points within string)
- businessGoals (use bullet points within string)
- successMetrics (include specific, measurable KPIs with targets)
- futureFeatures
- techStack
- constraints`;

    // Add current date/time context to the prompt
    const promptWithContext = getContextHeader() + basePrompt;

    const parsed = await callLLMJson<Record<string, string>>({
      provider,
      apiKey,
      model,
      baseUrl,
      systemPrompt:
        'You are a brilliant product strategist. Analyze product ideas and return structured JSON for Product Requirements Documents.',
      userPrompt: promptWithContext,
      geminiProperties: {
        productName: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        problemStatement: { type: Type.STRING },
        proposedSolution: { type: Type.STRING },
        coreFeatures: { type: Type.STRING },
        keyFeatures: { type: Type.STRING },
        businessGoals: { type: Type.STRING },
        successMetrics: { type: Type.STRING },
        futureFeatures: { type: Type.STRING },
        techStack: { type: Type.STRING },
        constraints: { type: Type.STRING }
      },
      geminiRequired: [
        'productName',
        'targetAudience',
        'problemStatement',
        'proposedSolution',
        'coreFeatures',
        'keyFeatures',
        'businessGoals',
        'successMetrics'
      ]
    });
    const result: PrdInput = {
      productName: parsed.productName || DEFAULT_PRD_INPUT.productName,
      targetAudience: parsed.targetAudience || DEFAULT_PRD_INPUT.targetAudience,
      problemStatement:
        parsed.problemStatement || DEFAULT_PRD_INPUT.problemStatement,
      proposedSolution:
        parsed.proposedSolution || DEFAULT_PRD_INPUT.proposedSolution,
      coreFeatures: parsed.coreFeatures || DEFAULT_PRD_INPUT.coreFeatures,
      keyFeatures: parsed.keyFeatures || DEFAULT_PRD_INPUT.keyFeatures,
      businessGoals: parsed.businessGoals || DEFAULT_PRD_INPUT.businessGoals,
      successMetrics: parsed.successMetrics || DEFAULT_PRD_INPUT.successMetrics,
      futureFeatures: parsed.futureFeatures || DEFAULT_PRD_INPUT.futureFeatures,
      techStack: parsed.techStack || DEFAULT_PRD_INPUT.techStack,
      constraints: parsed.constraints || DEFAULT_PRD_INPUT.constraints
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while generating PRD inputs.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

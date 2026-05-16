/**
 * Optional OpenAI-powered insights endpoint.
 * Active only when OPENAI_API_KEY is set in the environment.
 * Otherwise returns 501 and the frontend falls back to rule-based insights.
 */

import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const InsightSchema = z.object({
  headline: z.string(),
  body: z.string(),
});

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: 'AI not configured. Set OPENAI_API_KEY to enable.' },
      { status: 501 },
    );
  }

  try {
    const body = await request.json();
    const { metrics } = body as { metrics: Record<string, unknown> };

    const openai = createOpenAI({ apiKey });

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: InsightSchema,
      prompt: `You are an AI analytics assistant for a CRM + LMS education-center SaaS.
Metrics: ${JSON.stringify(metrics)}
Produce a concise platform summary (max 3 sentences) highlighting trends, risks, and opportunities.
Be specific with numbers.`,
    });

    return NextResponse.json({
      headline: object.headline,
      body: object.body,
      source: 'openai',
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

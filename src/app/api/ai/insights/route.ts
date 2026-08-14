/**
 * Optional OpenAI-powered insights endpoint.
 * Active only when OPENAI_API_KEY is set in the environment.
 * Otherwise returns 501 and the frontend falls back to rule-based insights.
 */

import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getServerSession, rateLimitKey } from '@/lib/auth/server-session';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

const InsightSchema = z.object({
  headline: z.string(),
  body: z.string(),
});

/** Metrics summaries, not a chat: a handful per user per window is plenty. */
const INSIGHTS_RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 };

/** The metrics blob is interpolated straight into the prompt, so it is billed. */
const MAX_METRICS_CHARS = 8_000;

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? createOpenAI({ apiKey }) : null;

export async function POST(request: Request) {
  // Checked before the 501 below: whether an API key is configured is not
  // something an anonymous caller needs to learn.
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const limit = rateLimit('ai-insights', rateLimitKey(session), INSIGHTS_RATE_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: rateLimitHeaders(INSIGHTS_RATE_LIMIT.limit, limit) },
    );
  }

  if (!openai) {
    return NextResponse.json(
      { message: 'AI not configured. Set OPENAI_API_KEY to enable.' },
      { status: 501 },
    );
  }

  try {
    const body = await request.json();
    const { metrics } = body as { metrics: Record<string, unknown> };

    const serialized = JSON.stringify(metrics ?? {});
    if (serialized.length > MAX_METRICS_CHARS) {
      return NextResponse.json({ message: 'Metrics payload too large' }, { status: 413 });
    }

    const { object } = await generateObject({
      model: openai!('gpt-4o-mini'),
      schema: InsightSchema,
      prompt: `You are an AI analytics assistant for a CRM + LMS education-center SaaS.
Metrics: ${serialized}
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

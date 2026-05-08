/**
 * Optional OpenAI-powered insights endpoint.
 * Active only when OPENAI_API_KEY is set in the environment.
 * Otherwise returns 501 and the frontend falls back to rule-based insights.
 */

import { NextResponse } from 'next/server';

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

    const prompt = `You are an AI analytics assistant for a CRM + LMS education-center SaaS.
Metrics: ${JSON.stringify(metrics)}
Produce a concise platform summary (max 3 sentences) highlighting trends, risks, and opportunities.
Be specific with numbers. Return JSON: {"headline": "...", "body": "..."}.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ message: err }, { status: resp.status });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);
    return NextResponse.json({
      headline: parsed.headline ?? 'AI summary',
      body: parsed.body ?? '',
      source: 'openai',
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { cookies } from 'next/headers';
import { serverLogger } from '@/lib/logger';
import { normalizeMessages } from '@/lib/ai/normalize-messages';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ── Fetch from backend with auth cookie ──────────────────────────────
async function fetchFromBackend(path: string, params: Record<string, string | number> = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  ).toString();
  const url = `${backendUrl.replace(/\/$/, '')}/api/${path.replace(/^\//, '')}${qs ? '?' + qs : ''}`;

  serverLogger.debug(`[AI Tool] ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      serverLogger.warn(`[AI Tool] GET ${url} -> ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    serverLogger.warn(`[AI Tool] ${url} network error:`, err);
    return null;
  }
}

// ── Detect intent and fetch data ─────────────────────────────────────
async function getContextData(userMessage: string): Promise<string> {
  const msg = userMessage.toLowerCase().trim();

  const FILLER_WORDS = ['bor', "yo'q", 'bormi', 'yoqmi', 'nechta', 'qancha', 'kim', 'qani', 'qayerda'];
  const isQuestionWord = (w: string) => FILLER_WORDS.includes(w.toLowerCase());

  const studentPatterns = [
    /(?:student|o'quvchi|talaba|bola)\s+([a-z''ʼ ]+?)(?:\s+degan|\s+ismli|$)/i,
    /([a-z''ʼ ]+?)\s+(?:degan\s+)?(?:student|o'quvchi|talaba|bola)\s+(?:bormi|yoqmi|izla)/i,
    /(?:ismi|nomi)\s+([a-z''ʼ ]+)/i,
  ];

  let searchName = '';
  for (const pat of studentPatterns) {
    const match = msg.match(pat);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (!isQuestionWord(candidate) && candidate.length > 2) {
        searchName = candidate;
        break;
      }
    }
  }

  // Collect all fetch promises in parallel
  const fetches: Promise<{ key: string; data: unknown }>[] = [];

  if (searchName) {
    fetches.push(
      fetchFromBackend('student', { search: searchName, limit: 5 }).then((d) => ({ key: 'student', data: d })),
    );
  }
  if (/nechta|qancha|stat|hisobot|dashboard|umumiy|jami|holat|daromad|pul/i.test(msg)) {
    fetches.push(fetchFromBackend('dashboard/summary').then((d) => ({ key: 'summary', data: d })));
  }
  if (/lead|lid|yangi|qiziq|murojaat/i.test(msg)) {
    fetches.push(fetchFromBackend('lead', { limit: 10 }).then((d) => ({ key: 'leads', data: d })));
  }
  if (/group|guruh|sinf|klass/i.test(msg)) {
    fetches.push(fetchFromBackend('groups').then((d) => ({ key: 'groups', data: d })));
  }

  if (fetches.length === 0) return '';

  const results = await Promise.allSettled(fetches);
  const parts: string[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { key, data } = result.value;

    if (key === 'student') {
      const d = data as { items?: unknown[] } | null;
      if (d?.items?.length) {
        parts.push(`\n Talabalar topildi («${searchName}»): ${JSON.stringify(d.items)}`);
      } else {
        parts.push(`\n «${searchName}» ismli talaba bazada topilmadi.`);
      }
    } else if (key === 'summary' && data) {
      parts.push(`\n Tizimning umumiy holati: ${JSON.stringify(data)}`);
    } else if (key === 'leads') {
      const d = data as { items?: unknown[] } | null;
      if (d?.items?.length) {
        parts.push(`\n So'nggi lidlar: ${JSON.stringify(d.items)}`);
      }
    } else if (key === 'groups' && data) {
      parts.push(`\n Mavjud guruhlar: ${JSON.stringify(data)}`);
    }
  }

  return parts.join('\n');
}

// ── POST handler ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages } = await req.json();

  const formattedMessages = normalizeMessages(messages);

  const lastUserMsg = [...formattedMessages].reverse().find((m) => m.role === 'user');
  const userText = lastUserMsg?.content || '';

  const contextData = await getContextData(userText);

  const systemPrompt = `You are a professional AI assistant for the "Bilim Nuru" CRM/LMS.
Your goal is to provide helpful, data-driven answers based on the real-time database context provided below.

--- DATABASE CONTEXT ---
${contextData || 'No specific database records found for this query.'}
--- END CONTEXT ---

CRITICAL RULES:
1. Use the DATABASE CONTEXT to answer. If it says 0 students or "not found", inform the user politely.
2. NEVER show raw JSON or code to the user.
3. Convert the data into a human-readable, friendly response in Uzbek (or English if the user asked in English).
4. If the context is empty, respond based on general knowledge about the CRM features (Leads, Students, Groups, Finance).
5. Be concise and professional.`;

  try {
    const result = await streamText({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: formattedMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    serverLogger.error('[AI] Error:', error);
    return new Response(
      JSON.stringify({ error: 'AI xizmatida xatolik yuz berdi.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { cookies } from 'next/headers';
import { serverLogger } from '@/lib/logger';

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
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Detect intent and fetch data ─────────────────────────────────────
async function getContextData(userMessage: string): Promise<string> {
  const msg = userMessage.toLowerCase().trim();
  const parts: string[] = [];

  // Helper to check if a word is just a filler or question word
  const isQuestionWord = (w: string) => 
    ['bor', 'yo\'q', 'bormi', 'yoqmi', 'nechta', 'qancha', 'kim', 'qani', 'qayerda'].includes(w.toLowerCase());

  // Student search - more specific regex
  const studentPatterns = [
    /(?:student|o'quvchi|talaba|bola)\s+([a-z'‘ʼ ]+?)(?:\s+degan|\s+ismli|$)/i,
    /([a-z'‘ʼ ]+?)\s+(?:degan\s+)?(?:student|o'quvchi|talaba|bola)\s+(?:bormi|yoqmi|izla)/i,
    /(?:ismi|nomi)\s+([a-z'‘ʼ ]+)/i,
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

  // If specific name found, search for it
  if (searchName) {
    const data = await fetchFromBackend('student', { search: searchName, limit: 5 });
    if (data?.items?.length > 0) {
      parts.push(`\n📋 Talabalar topildi («${searchName}»): ${JSON.stringify(data.items)}`);
    } else {
      parts.push(`\n⚠️ «${searchName}» ismli talaba bazada topilmadi.`);
    }
  }

  // Statistics / "How many" - check summary
  if (/nechta|qancha|stat|hisobot|dashboard|umumiy|jami|holat|daromad|pul/i.test(msg)) {
    const data = await fetchFromBackend('dashboard/summary');
    if (data) {
      parts.push(`\n📊 Tizimning umumiy holati: ${JSON.stringify(data)}`);
    }
  }

  // Leads check
  if (/lead|lid|yangi|qiziq|murojaat/i.test(msg)) {
    const data = await fetchFromBackend('lead', { limit: 10 });
    if (data?.items?.length > 0) {
      parts.push(`\n📋 So'nggi lidlar: ${JSON.stringify(data.items)}`);
    }
  }

  // Groups
  if (/group|guruh|sinf|klass/i.test(msg)) {
    const data = await fetchFromBackend('groups');
    if (data) {
      parts.push(`\n📋 Mavjud guruhlar: ${JSON.stringify(data)}`);
    }
  }

  return parts.join('\n');
}

// ── POST handler ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages } = await req.json();

  // Normalize messages to { role, content }
  const formattedMessages = messages.map((m: any) => {
    let content = '';
    if (typeof m.content === 'string') content = m.content;
    else if (Array.isArray(m.parts)) {
      content = m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    return {
      role: ['user', 'assistant', 'system'].includes(m.role) ? m.role : 'user',
      content: content || ' ',
    };
  });

  // Get the last user message
  const lastUserMsg = [...formattedMessages].reverse().find((m: any) => m.role === 'user');
  const userText = lastUserMsg?.content || '';

  // Fetch relevant data from the database
  const contextData = await getContextData(userText);

  const systemPrompt = `You are a professional AI assistant for the "Bilim Nuru" CRM/LMS.
Your goal is to provide helpful, data-driven answers based on the real-time database context provided below.

--- DATABASE CONTEXT ---
${contextData || 'No specific database records found for this query.'}
--- END CONTEXT ---

CRITICAL RULES:
1. Use the DATABASE CONTEXT to answer. If it says 0 students or "not found", inform the user politely.
2. NEVER show raw JSON or code like '{"items":[]}' to the user.
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

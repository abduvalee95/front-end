import { createGroq } from '@ai-sdk/groq';
import { tool, streamText, stepCountIs } from 'ai';
import { z } from 'zod';
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

// ── POST to backend with auth cookie ────────────────────────────────
async function postToBackend(path: string, body: Record<string, unknown>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${backendUrl.replace(/\/$/, '')}/api/${path.replace(/^\//, '')}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { error: `Backend error ${res.status}` };
    return await res.json();
  } catch (err) {
    serverLogger.warn(`[AI Tool] POST ${url} network error:`, err);
    return { error: 'Network error' };
  }
}

// Keep postToBackend available for future write tools
void (postToBackend as unknown as () => void);

// ── System prompt ────────────────────────────────────────────────────
const systemPrompt = `Sen "Bilim Nuru" ta'lim markazining AI yordamchisisisan. Uzbek va Ruscha yaxshi tushunadisan.

QOIDALAR:
1. Foydalanuvchi roliga qarab javob ber (TEACHER faqat o'z talabalarini ko'radi — bu backend tomonidan avtomatik amalga oshiriladi)
2. To'lov yoki ro'yxatga olish so'ralganda PROPOSE qil, hech qachon o'zing bajarmа
3. Agar bir nechta talaba topilsa — aniqlashtir, ID o'ylab topma
4. JSON yoki kod ko'rsatma, faqat odam tushunadigan javob ber
5. Agar backend 403 qaytarsa — "Bu ma'lumot faqat administrator uchun mavjud" de
6. Qisqa va aniq javob ber

Bugun: ${new Date().toLocaleDateString('uz-UZ')}`;

// ── Tool: find_student ───────────────────────────────────────────────
const find_student = tool({
  description:
    "Talabani ism yoki telefon raqami bo'yicha qidirish. To'liq ma'lumot: profil, guruhlar, balans, oxirgi to'lov, davomat foizi.",
  inputSchema: z.object({
    query: z.string().describe('Ism yoki telefon raqami'),
  }),
  execute: async ({ query }) => {
    const data = await fetchFromBackend('student', { search: query, limit: 5 });
    const items: Record<string, unknown>[] = data?.items ?? [];

    if (items.length === 0) {
      return { found: false, message: 'Talaba topilmadi: ' + query };
    }

    if (items.length > 1) {
      return {
        found: false,
        candidates: items.map((s) => ({ id: s.id, name: s.name, phone: s.phone })),
      };
    }

    // Exactly one match — fetch full detail
    const id = items[0].id;
    const detail = await fetchFromBackend(`student/${id}`);
    const s = (detail ?? items[0]) as Record<string, unknown>;
    return {
      found: true,
      student: {
        id: s.id,
        name: s.name,
        phone: s.phone,
        status: s.status,
        address: s.address,
        parent: s.parent,
        enrollments: (s.enrollments as Record<string, unknown>[] | undefined)?.map((e) => ({
          group: (e.group as Record<string, unknown> | undefined)?.name,
          course: (
            (e.group as Record<string, unknown> | undefined)?.course as
              | Record<string, unknown>
              | undefined
          )?.title,
        })),
      },
    };
  },
});

// ── Tool: list_unpaid_students ───────────────────────────────────────
const list_unpaid_students = tool({
  description: "Bu oy to'lov qilmagan yoki qarzdor talabalar ro'yxati.",
  inputSchema: z.object({
    month: z.string().optional().describe('YYYY-MM format, default joriy oy'),
  }),
  execute: async (_input) => {
    const data = await fetchFromBackend('billing/invoices', { status: 'OPEN', limit: 50 });
    const items: Record<string, unknown>[] = data?.items ?? [];
    return {
      students: items.map((i) => ({
        name: i.student_name,
        phone: i.student_phone,
        debt: i.debt,
        month: i.month,
      })),
      total: items.length,
    };
  },
});

// ── Tool: get_today_schedule ─────────────────────────────────────────
const get_today_schedule = tool({
  description: "Bugungi yoki ko'rsatilgan kundagi darslar jadvali.",
  inputSchema: z.object({
    date: z.string().optional().describe('YYYY-MM-DD, default bugun'),
  }),
  execute: async ({ date }) => {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const data = await fetchFromBackend('groups', { limit: 100 });
    const items: Record<string, unknown>[] = data?.items ?? [];
    return {
      date: targetDate,
      groups: items.map((g) => ({
        id: g.id,
        name: g.name,
        course: (g.course as Record<string, unknown> | undefined)?.title,
        teacher: (g.teacher as Record<string, unknown> | undefined)?.full_name,
      })),
    };
  },
});

// ── Tool: get_financial_summary ──────────────────────────────────────
const get_financial_summary = tool({
  description: 'Moliyaviy xulosa: daromad, xarajat, foyda. Faqat ADMIN va MANAGER uchun.',
  inputSchema: z.object({
    period: z.enum(['this_month', 'last_month', 'this_week']).optional(),
  }),
  execute: async (_input) => {
    const data = await fetchFromBackend('dashboard/summary');
    if (!data) return { error: 'forbidden' };
    return {
      revenue: data.paymentsTotalAmount,
      paymentsCount: data.paymentsCount,
      leadsNew: data.leadsNew,
      studentsTotal: data.studentsTotal,
      attendanceRate: data.attendanceRate,
    };
  },
});

// ── Tool: list_groups ────────────────────────────────────────────────
const list_groups = tool({
  description: "Barcha guruhlar ro'yxati, ixtiyoriy kurs yoki o'qituvchi bo'yicha filtr.",
  inputSchema: z.object({
    query: z.string().optional(),
  }),
  execute: async ({ query }) => {
    const data = await fetchFromBackend('groups', { limit: 100 });
    let items: Record<string, unknown>[] = data?.items ?? [];

    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (g) =>
          String(g.name ?? '').toLowerCase().includes(q) ||
          String((g.course as Record<string, unknown> | undefined)?.title ?? '')
            .toLowerCase()
            .includes(q) ||
          String((g.teacher as Record<string, unknown> | undefined)?.full_name ?? '')
            .toLowerCase()
            .includes(q),
      );
    }

    return {
      groups: items.slice(0, 20).map((g) => ({
        id: g.id,
        name: g.name,
        course: (g.course as Record<string, unknown> | undefined)?.title,
        teacher: (g.teacher as Record<string, unknown> | undefined)?.full_name,
        studentCount: (g.enrollments as unknown[] | undefined)?.length ?? 0,
      })),
    };
  },
});

// ── Tool: get_group_attendance ───────────────────────────────────────
const get_group_attendance = tool({
  description: 'Guruhning davomat xulosasi.',
  inputSchema: z.object({
    group_query: z.string(),
  }),
  execute: async ({ group_query }) => {
    const data = await fetchFromBackend('groups', { limit: 100 });
    const items: Record<string, unknown>[] = data?.items ?? [];

    const q = group_query.toLowerCase();
    const group = items.find((g) => String(g.name ?? '').toLowerCase().includes(q));

    if (!group) {
      return { error: 'Guruh topilmadi: ' + group_query };
    }

    const enrollData = await fetchFromBackend(`enrollment/group/${group.id}`);
    const enrollments: Record<string, unknown>[] = Array.isArray(enrollData)
      ? enrollData
      : (enrollData?.items ?? []);

    return {
      group: group.name,
      course: (group.course as Record<string, unknown> | undefined)?.title,
      enrolledCount: enrollments.length,
      students: enrollments.slice(0, 10).map((e) => ({
        name: (e.student as Record<string, unknown> | undefined)?.name,
        status: (e.student as Record<string, unknown> | undefined)?.status,
      })),
    };
  },
});

// ── Tool: propose_enroll_student (proposal only, no write) ───────────
const propose_enroll_student = tool({
  description:
    "Talabani guruhga yozish TAKLIFI. Hech qachon o'zi bajarmaydi — foydalanuvchi tasdiqlashi kerak.",
  inputSchema: z.object({
    student_query: z.string(),
    group_query: z.string(),
    monthly_fee: z.number().optional(),
  }),
  execute: async ({ student_query, group_query, monthly_fee }) => {
    const [studentData, groupData] = await Promise.all([
      fetchFromBackend('student', { search: student_query, limit: 3 }),
      fetchFromBackend('groups', { limit: 100 }),
    ]);

    const students: Record<string, unknown>[] = studentData?.items ?? [];
    const groups: Record<string, unknown>[] = groupData?.items ?? [];

    const student = students[0];
    const q = group_query.toLowerCase();
    const group = groups.find((g) => String(g.name ?? '').toLowerCase().includes(q));

    if (!student || !group) {
      return { error: 'Talaba yoki guruh topilmadi' };
    }

    return {
      kind: 'proposal',
      action: 'enroll_student',
      summary: `${student.name}ni "${group.name}" guruhiga qo'shish${monthly_fee ? ' — ' + monthly_fee + ' KGS/oy' : ''}`,
      confirmUrl: '/api/proxy/enrollment',
      confirmMethod: 'POST',
      confirmBody: { student_id: student.id, group_id: group.id },
    };
  },
});

// ── Tool: propose_record_payment (proposal only, no write) ───────────
const propose_record_payment = tool({
  description: "Talabadan to'lov qabul qilish TAKLIFI. Hech qachon o'zi bajarmaydi.",
  inputSchema: z.object({
    student_query: z.string(),
    amount: z.number(),
    method: z.enum(['CASH', 'CARD', 'TRANSFER']).optional(),
    description: z.string().optional(),
  }),
  execute: async ({ student_query, amount, method, description }) => {
    const studentData = await fetchFromBackend('student', { search: student_query, limit: 3 });
    const students: Record<string, unknown>[] = studentData?.items ?? [];
    const student = students[0];

    if (!student) {
      return { error: 'Talaba topilmadi: ' + student_query };
    }

    return {
      kind: 'proposal',
      action: 'record_payment',
      summary: `${student.name}dan ${amount.toLocaleString()} KGS ${method ?? 'CASH'} qabul qilish`,
      confirmUrl: '/api/proxy/payment',
      confirmMethod: 'POST',
      confirmBody: { student_id: student.id, amount, method: method ?? 'CASH', description },
    };
  },
});

// ── POST handler ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages } = await req.json();
  const formattedMessages = normalizeMessages(messages);

  try {
    const result = await streamText({
      model: groq(process.env.AI_MODEL || 'llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: formattedMessages,
      tools: {
        find_student,
        list_unpaid_students,
        get_today_schedule,
        get_financial_summary,
        list_groups,
        get_group_attendance,
        propose_enroll_student,
        propose_record_payment,
      },
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    serverLogger.error('[AI] Error:', error);
    return new Response(JSON.stringify({ error: 'AI xizmatida xatolik.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

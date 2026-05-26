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

// ── System prompt ────────────────────────────────────────────────────
const systemPrompt = `You are the AI assistant for education center. You understand Uzbek, Russian, and English.

RULES:
1. ALWAYS respond in the SAME LANGUAGE the user writes in. If user writes in Russian → respond in Russian. If Uzbek → Uzbek. If English → English. NEVER switch languages.
2. Role-based access: TEACHER sees only their own students — enforced automatically by backend.
3. For payment or enrollment requests: call propose_* tool, NEVER execute writes yourself.
4. If multiple students found — ask for clarification, never invent an ID.
5. NEVER output JSON, endpoints, or technical details — only human-readable responses.
6. If backend returns 403 — say "This data is only available to administrators."
7. After propose_* tool returns — say ONLY "Please click the confirm button below." Never repeat JSON or endpoint info.
8. Keep answers short and precise.

Today: ${new Date().toLocaleDateString('uz-UZ')}`;

// ── POST handler ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages } = await req.json();
  const formattedMessages = normalizeMessages(messages);

  // Derive internal proxy base from the incoming request URL.
  // This makes tools work on any deployment (local, Vercel, Railway)
  // by routing through the already-working /api/proxy/ route.
  const reqOrigin = new URL(req.url).origin;

  // ── Internal proxy fetch ──────────────────────────────────────────
  async function fetchProxy(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<Record<string, unknown> | null> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString();

    const url = `${reqOrigin}/api/proxy/${path.replace(/^\//, '')}${qs ? '?' + qs : ''}`;
    serverLogger.debug(`[AI Tool] ${url}`);

    try {
      const res = await fetch(url, {
        headers: {
          Cookie: cookieHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        serverLogger.warn(`[AI Tool] GET ${url} -> ${res.status}`);
        if (res.status === 401) return { _error: 'unauthorized' };
        if (res.status === 403) return { _error: 'forbidden' };
        return { _error: `backend_${res.status}` };
      }

      return await res.json();
    } catch (err) {
      serverLogger.warn(`[AI Tool] ${url} network error:`, err);
      return { _error: 'network_error' };
    }
  }

  // ── Tool: find_student ──────────────────────────────────────────
  const find_student = tool({
    description:
      "Search student by name or phone number. Returns full profile: groups, balance, last payment, attendance rate.",
    inputSchema: z.object({
      query: z.string().describe('Name or phone number'),
    }),
    execute: async ({ query }) => {
      const data = await fetchProxy('student', { search: query, limit: 5 });
      if (data?._error) return { found: false, error: data._error };

      const items: Record<string, unknown>[] = (data as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];

      if (items.length === 0) return { found: false, message: 'Student not found: ' + query };

      if (items.length > 1) {
        return {
          found: false,
          candidates: items.map((s) => ({ id: s.id, name: s.name, phone: s.phone })),
        };
      }

      const id = items[0].id as string;
      const detail = await fetchProxy(`student/${id}`);
      const s = (detail?._error ? items[0] : detail ?? items[0]) as Record<string, unknown>;

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
            course: ((e.group as Record<string, unknown> | undefined)?.course as Record<string, unknown> | undefined)?.title,
          })),
        },
      };
    },
  });

  // ── Tool: list_unpaid_students ──────────────────────────────────
  const list_unpaid_students = tool({
    description: "List students who haven't paid this month or are in debt.",
    inputSchema: z.object({
      month: z.string().optional().describe('YYYY-MM format, default current month'),
    }),
    execute: async (_input) => {
      const data = await fetchProxy('billing/invoices', { status: 'OPEN', limit: 50 });
      if (data?._error) return { error: data._error, students: [], total: 0 };

      const items: Record<string, unknown>[] = (data as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];
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

  // ── Tool: get_today_schedule ────────────────────────────────────
  const get_today_schedule = tool({
    description: "Today's or a specific day's class schedule.",
    inputSchema: z.object({
      date: z.string().optional().describe('YYYY-MM-DD, default today'),
    }),
    execute: async ({ date }) => {
      const targetDate = date ?? new Date().toISOString().slice(0, 10);
      const data = await fetchProxy('groups', { limit: 100 });
      if (data?._error) return { error: data._error, date: targetDate, groups: [] };

      const items: Record<string, unknown>[] = (data as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];
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

  // ── Tool: get_financial_summary ─────────────────────────────────
  const get_financial_summary = tool({
    description: 'Financial summary: revenue, expenses, profit. ADMIN and MANAGER only.',
    inputSchema: z.object({
      period: z.enum(['this_month', 'last_month', 'this_week']).optional(),
    }),
    execute: async (_input) => {
      const data = await fetchProxy('dashboard/summary');
      if (!data || data._error === 'forbidden') return { error: 'forbidden' };
      if (data._error) return { error: data._error };
      return {
        revenue: data.paymentsTotalAmount,
        paymentsCount: data.paymentsCount,
        leadsNew: data.leadsNew,
        studentsTotal: data.studentsTotal,
        attendanceRate: data.attendanceRate,
      };
    },
  });

  // ── Tool: list_groups ───────────────────────────────────────────
  const list_groups = tool({
    description: "List all groups, optionally filtered by course or teacher name.",
    inputSchema: z.object({
      query: z.string().optional(),
    }),
    execute: async ({ query }) => {
      const data = await fetchProxy('groups', { limit: 100 });
      if (data?._error) return { error: data._error, groups: [] };

      let items: Record<string, unknown>[] = (data as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];

      if (query) {
        const q = query.toLowerCase();
        items = items.filter(
          (g) =>
            String(g.name ?? '').toLowerCase().includes(q) ||
            String((g.course as Record<string, unknown> | undefined)?.title ?? '').toLowerCase().includes(q) ||
            String((g.teacher as Record<string, unknown> | undefined)?.full_name ?? '').toLowerCase().includes(q),
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

  // ── Tool: get_group_attendance ──────────────────────────────────
  const get_group_attendance = tool({
    description: "Attendance summary for a specific group.",
    inputSchema: z.object({
      group_query: z.string(),
    }),
    execute: async ({ group_query }) => {
      const data = await fetchProxy('groups', { limit: 100 });
      if (data?._error) return { error: data._error };

      const items: Record<string, unknown>[] = (data as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];
      const q = group_query.toLowerCase();
      const group = items.find((g) => String(g.name ?? '').toLowerCase().includes(q));

      if (!group) return { error: 'Group not found: ' + group_query };

      const enrollData = await fetchProxy(`enrollment/group/${group.id as string}`);
      if (enrollData?._error) return { error: enrollData._error };

      const enrollments: Record<string, unknown>[] = Array.isArray(enrollData)
        ? enrollData
        : ((enrollData as Record<string, unknown>)?.items as Record<string, unknown>[] ?? []);

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

  // ── Tool: propose_enroll_student ────────────────────────────────
  const propose_enroll_student = tool({
    description:
      "PROPOSAL to enroll a student in a group. Never executes — user must confirm.",
    inputSchema: z.object({
      student_query: z.string(),
      group_query: z.string(),
      monthly_fee: z.number().optional(),
    }),
    execute: async ({ student_query, group_query, monthly_fee }) => {
      const [studentData, groupData] = await Promise.all([
        fetchProxy('student', { search: student_query, limit: 3 }),
        fetchProxy('groups', { limit: 100 }),
      ]);

      if (studentData?._error || groupData?._error)
        return { error: studentData?._error ?? groupData?._error };

      const students: Record<string, unknown>[] = (studentData as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];
      const groups: Record<string, unknown>[] = (groupData as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];

      const student = students[0];
      const q = group_query.toLowerCase();
      const group = groups.find((g) => String(g.name ?? '').toLowerCase().includes(q));

      if (!student || !group) return { error: 'Student or group not found' };

      return {
        kind: 'proposal',
        action: 'enroll_student',
        summary: `${student.name} → "${group.name}"${monthly_fee ? ' — ' + monthly_fee + ' KGS/month' : ''}`,
        confirmUrl: '/api/proxy/enrollment',
        confirmMethod: 'POST',
        confirmBody: { student_id: student.id, group_id: group.id },
      };
    },
  });

  // ── Tool: propose_record_payment ────────────────────────────────
  const propose_record_payment = tool({
    description: "PROPOSAL to record a payment from a student. Never executes — user must confirm.",
    inputSchema: z.object({
      student_query: z.string(),
      amount: z.number(),
      method: z.enum(['CASH', 'CARD', 'TRANSFER']).optional(),
      description: z.string().optional(),
    }),
    execute: async ({ student_query, amount, method, description }) => {
      const studentData = await fetchProxy('student', { search: student_query, limit: 3 });
      if (studentData?._error) return { error: studentData._error };

      const students: Record<string, unknown>[] = (studentData as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [];
      const student = students[0];

      if (!student) return { error: 'Student not found: ' + student_query };

      return {
        kind: 'proposal',
        action: 'record_payment',
        summary: `${student.name} — ${amount.toLocaleString()} KGS (${method ?? 'CASH'})`,
        confirmUrl: '/api/proxy/payment',
        confirmMethod: 'POST',
        confirmBody: { student_id: student.id, amount, method: method ?? 'CASH', description },
      };
    },
  });

  // ── Stream ──────────────────────────────────────────────────────
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
    return new Response(JSON.stringify({ error: 'AI service error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

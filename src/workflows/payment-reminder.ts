import { sleep, FatalError, RetryableError } from 'workflow';
import type { Invoice } from '@/types/analytics';

// ── Step: fetch overdue invoices from backend ────────────────────────
async function fetchOverdueInvoices(): Promise<Invoice[]> {
  'use step';

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiKey = process.env.WORKFLOW_API_SECRET;

  const res = await fetch(`${backendUrl}/api/billing/invoices?status=OVERDUE&limit=100`, {
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new FatalError('Backend auth failed — check WORKFLOW_API_SECRET');
  }
  if (!res.ok) {
    throw new RetryableError(`Backend returned ${res.status}`, { retryAfter: '5m' });
  }

  const data = await res.json();
  return (data.items ?? []) as Invoice[];
}

// ── Helper: send single WhatsApp message via Twilio (called inside step) ──
async function sendWhatsAppReminder(invoice: Invoice): Promise<{ success: boolean; sid?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !from) {
    throw new FatalError('Twilio credentials missing: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM');
  }

  const to = `whatsapp:${invoice.student_phone}`;
  const debt = parseFloat(invoice.debt).toLocaleString('uz-UZ');
  const dueDate = new Date(invoice.due_date).toLocaleDateString('uz-UZ');

  const body =
    `Hurmatli ${invoice.student_name},\n\n` +
    `To'lov eslatmasi: ${invoice.month} oyi uchun ${debt} so'm qarzingiz mavjud.\n` +
    `To'lov muddati: ${dueDate}.\n\n` +
    `Iltimos, imkon qadar tezroq to'lovni amalga oshiring.\n` +
    `Bilim Nuru o'quv markazi`;

  const params = new URLSearchParams({ From: from, To: to, Body: body });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
      body: params.toString(),
    },
  );

  if (res.status === 429) {
    throw new RetryableError('Twilio rate limited', { retryAfter: '1m' });
  }
  if (!res.ok) {
    const err = await res.text();
    throw new RetryableError(`Twilio error ${res.status}: ${err}`, { retryAfter: '10m' });
  }

  const data = await res.json();
  return { success: true, sid: data.sid };
}

// ── Step: send batch reminders ───────────────────────────────────────
async function sendBatchReminders(invoices: Invoice[]): Promise<{ sent: number; failed: number }> {
  'use step';

  let sent = 0;
  let failed = 0;

  for (const invoice of invoices) {
    try {
      await sendWhatsAppReminder(invoice);
      sent++;
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}

// ── Workflow: daily overdue invoice reminder loop ────────────────────
export async function paymentReminderWorkflow(): Promise<void> {
  'use workflow';

  // Run indefinitely, once per day
  while (true) {
    const invoices = await fetchOverdueInvoices();

    if (invoices.length > 0) {
      await sendBatchReminders(invoices);
    }

    // Wait 24 hours before next run
    await sleep('24h');
  }
}

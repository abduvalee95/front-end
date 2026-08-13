import { FatalError, RetryableError, getStepMetadata } from 'workflow';
import type { Invoice } from '@/types/analytics';
import { BACKEND_URL } from '@/lib/server-env';

/** How many reminders may be in flight at once. Keeps Twilio from rate-limiting
 *  us into a retry storm without serialising 100 round-trips. */
const SEND_CONCURRENCY = 5;

export interface ReminderOutcome {
  invoiceId: string;
  studentPhone: string;
  status: 'sent' | 'failed';
  /** Twilio message SID, when the send was confirmed. */
  sid?: string;
  /** Why it failed, for the dead-letter list surfaced to an operator. */
  reason?: string;
  /** True when the send may in fact have reached Twilio (an ambiguous
   *  transport failure). Deliberately NOT retried — see sendReminder. */
  ambiguous?: boolean;
}

export interface ReminderRunSummary {
  total: number;
  sent: number;
  failed: number;
  /** Failures needing a human: dead letters rather than silent counters. */
  deadLetters: ReminderOutcome[];
}

// ── Step: fetch overdue invoices from backend ────────────────────────
async function fetchOverdueInvoices(): Promise<Invoice[]> {
  'use step';

  const apiKey = process.env.WORKFLOW_API_SECRET;

  const res = await fetch(`${BACKEND_URL}/api/billing/invoices?status=OVERDUE&limit=100`, {
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

function buildMessage(invoice: Invoice): string {
  const debt = parseFloat(invoice.debt).toLocaleString('uz-UZ');
  const dueDate = new Date(invoice.due_date).toLocaleDateString('uz-UZ');

  return (
    `Hurmatli ${invoice.student_name},\n\n` +
    `To'lov eslatmasi: ${invoice.month} oyi uchun ${debt} so'm qarzingiz mavjud.\n` +
    `To'lov muddati: ${dueDate}.\n\n` +
    `Iltimos, imkon qadar tezroq to'lovni amalga oshiring.\n` +
    `Bilim Nuru o'quv markazi`
  );
}

/**
 * Step: send ONE reminder.
 *
 * One invoice per step is the point. Previously a single step looped over all
 * 100 invoices, so a crash at number 60 replayed the whole step and re-sent 60
 * WhatsApp messages to real parents. The engine checkpoints each step
 * separately, so a replay now skips every reminder already confirmed sent and
 * resumes at the one that failed.
 *
 * Failure handling is deliberately asymmetric, because the two mistakes are not
 * equally bad: a missed reminder can be re-sent by an operator, a duplicate
 * debt notice to a parent cannot be taken back.
 *
 *   - Definite non-delivery (429, 5xx)  -> RetryableError, safe to retry.
 *   - Definite rejection (other 4xx)    -> dead letter, retrying cannot help.
 *   - Ambiguous transport failure       -> dead letter, NOT retried: Twilio may
 *     (timeout / connection reset)         already have accepted the message.
 *
 * `stepId` is the SDK's idempotency key (stable across retries). Twilio's
 * Messages API has no idempotency-key parameter to pass it to, so it is
 * recorded on the outcome for correlation when an operator inspects a run.
 */
async function sendReminder(invoice: Invoice): Promise<ReminderOutcome> {
  'use step';

  const { stepId } = getStepMetadata();

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !from) {
    throw new FatalError(
      'Twilio credentials missing: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM',
    );
  }

  const base: Pick<ReminderOutcome, 'invoiceId' | 'studentPhone'> = {
    invoiceId: invoice.id,
    studentPhone: invoice.student_phone,
  };

  const params = new URLSearchParams({
    From: from,
    To: `whatsapp:${invoice.student_phone}`,
    Body: buildMessage(invoice),
  });

  let res: Response;
  try {
    res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
      body: params.toString(),
    });
  } catch (err) {
    // The request left this process but we never saw a response. Twilio may
    // have accepted it. Retrying here is what produces duplicate messages, so
    // stop and hand it to an operator instead.
    return {
      ...base,
      status: 'failed',
      ambiguous: true,
      reason: `Transport failure, delivery unknown (step ${stepId}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  if (res.status === 429) {
    throw new RetryableError('Twilio rate limited', { retryAfter: '1m' });
  }
  if (res.status >= 500) {
    throw new RetryableError(`Twilio error ${res.status}`, { retryAfter: '10m' });
  }
  if (!res.ok) {
    // 4xx other than 429: bad number, blocked recipient, template rejected.
    // Retrying sends the same request and gets the same answer.
    const detail = await res.text().catch(() => '');
    return {
      ...base,
      status: 'failed',
      reason: `Twilio rejected (${res.status}): ${detail.slice(0, 200)}`,
    };
  }

  const data = await res.json();
  return { ...base, status: 'sent', sid: data.sid };
}

/**
 * Workflow: one pass over today's overdue invoices.
 *
 * Runs once per invocation. The previous `while (true) { … sleep('24h') }`
 * meant a single immortal run owned the schedule: a missed day could not be
 * re-run, the next fire time was not inspectable, and re-triggering meant
 * killing and restarting the run. Scheduling now lives outside (cron ->
 * POST /api/workflows/payment-reminder), so each day is its own observable,
 * independently re-runnable run.
 *
 * Note on cross-run duplicates: within a run, steps are checkpointed and never
 * re-send. Two runs on the same day WOULD each send, because nothing durable
 * records "invoice X was reminded on date Y". Closing that needs a sent-log the
 * front-end does not own — a backend endpoint or Redis key per
 * `${invoice.id}:${YYYY-MM-DD}`. Until then, keep the cron to a single daily
 * fire and use the returned summary to decide on re-runs.
 */
export async function paymentReminderWorkflow(): Promise<ReminderRunSummary> {
  'use workflow';

  const invoices = await fetchOverdueInvoices();

  const outcomes: ReminderOutcome[] = [];

  // Bounded concurrency: parallel within a chunk, chunks in sequence.
  for (let i = 0; i < invoices.length; i += SEND_CONCURRENCY) {
    const chunk = invoices.slice(i, i + SEND_CONCURRENCY);
    const results = await Promise.all(chunk.map((invoice) => sendReminder(invoice)));
    outcomes.push(...results);
  }

  const deadLetters = outcomes.filter((o) => o.status === 'failed');

  return {
    total: outcomes.length,
    sent: outcomes.length - deadLetters.length,
    failed: deadLetters.length,
    deadLetters,
  };
}

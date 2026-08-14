import { NextResponse } from 'next/server';
import { start, getRun } from 'workflow/api';
import { paymentReminderWorkflow, type ReminderRunSummary } from '@/workflows/payment-reminder';
import { isValidAdminSecret } from '@/lib/auth/admin-secret';

/**
 * POST — run today's reminder pass.
 *
 * The workflow is a single pass now (it used to be an immortal
 * `while (true) … sleep('24h')` loop), so this endpoint is the schedule:
 * point a daily cron at it. Each call is its own run, which means a missed
 * day can simply be re-triggered.
 *
 * Fire it once per day. Two calls on the same day send two sets of reminders —
 * within a run steps are checkpointed and never re-send, but nothing durable
 * records "invoice X was reminded on date Y" across runs yet.
 */
export async function POST(request: Request) {
  if (!isValidAdminSecret(request.headers.get('x-admin-secret'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const run = await start(paymentReminderWorkflow);
  return NextResponse.json({ runId: run.runId, status: 'started' });
}

// GET — check status of a run
export async function GET(request: Request) {
  if (!isValidAdminSecret(request.headers.get('x-admin-secret'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return NextResponse.json({ message: 'runId query param required' }, { status: 400 });
  }

  // The result was previously fetched and thrown away, so this endpoint
  // answered `{ runId }` and nothing else — there was no way to see whether a
  // run succeeded or which reminders dead-lettered.
  const run = getRun<ReminderRunSummary>(runId);

  if (!(await run.exists)) {
    return NextResponse.json({ message: 'Run not found' }, { status: 404 });
  }

  const status = await run.status;

  // `returnValue` polls until the run completes, so it is only safe to read
  // once the status says it already has — otherwise this request hangs.
  const summary = status === 'completed' ? await run.returnValue : undefined;

  return NextResponse.json({
    runId,
    status,
    // Present once finished: { total, sent, failed, deadLetters }.
    ...(summary ? { summary } : {}),
  });
}

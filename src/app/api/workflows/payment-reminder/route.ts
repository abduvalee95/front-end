import { NextResponse } from 'next/server';
import { start, getRun } from 'workflow/api';
import { paymentReminderWorkflow } from '@/workflows/payment-reminder';

// POST — start the workflow (idempotent: check runId in query first)
export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const run = await start(paymentReminderWorkflow);
  return NextResponse.json({ runId: run.runId, status: 'started' });
}

// GET — check status of running workflow
export async function GET(request: Request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return NextResponse.json({ message: 'runId query param required' }, { status: 400 });
  }

  const run = getRun(runId);
  return NextResponse.json({ runId });
}

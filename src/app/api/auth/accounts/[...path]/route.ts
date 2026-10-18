import { NextRequest } from 'next/server';
import { handleAccountRequest } from '@/lib/auth/account-bff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return handleAccountRequest(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: Context) {
  return handleAccountRequest(request, (await context.params).path);
}

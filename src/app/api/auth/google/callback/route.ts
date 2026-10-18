import { NextRequest } from 'next/server';
import { handleGoogleCallback } from '@/lib/auth/account-bff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return handleGoogleCallback(request);
}

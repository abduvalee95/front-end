import { NextRequest } from 'next/server';
import { issueAuthCsrf } from '@/lib/auth/auth-csrf';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return issueAuthCsrf(request);
}

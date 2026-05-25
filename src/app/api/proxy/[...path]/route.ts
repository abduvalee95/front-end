import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL as BACKEND } from '@/lib/server-env';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = path.join('/');
  const search = req.nextUrl.search;
  const url = `${BACKEND}/api/${backendPath}${search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const contentType = req.headers.get('content-type') || '';
  let body: BodyInit | null = null;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (contentType.includes('multipart/form-data')) {
      body = await req.formData();
    } else if (contentType.includes('application/json')) {
      body = await req.text();
      headers['Content-Type'] = 'application/json';
    } else {
      body = await req.arrayBuffer();
    }
  }

  const res = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const resContentType = res.headers.get('content-type') || '';
  if (resContentType.includes('application/json')) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const blob = await res.blob();
  return new NextResponse(blob, {
    status: res.status,
    headers: { 'content-type': resContentType },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;

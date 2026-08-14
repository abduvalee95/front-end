import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AI_ACTIONS, isAiActionName } from '@/lib/ai/actions';
import { verifyAccessToken } from '@/lib/auth/verify-token';
import { BACKEND_URL } from '@/lib/server-env';
import { serverLogger } from '@/lib/logger';

/**
 * Executes a copilot proposal the user confirmed.
 *
 * This endpoint exists so that the browser never has to be told which URL to
 * call. It receives an action NAME plus a payload, resolves the name against
 * the server-side allowlist in `@/lib/ai/actions`, re-validates the payload
 * against that action's schema, and only then talks to the backend. An
 * unrecognised action or a payload that fails the schema is rejected here — the
 * request is never forwarded.
 *
 * The write is performed with the caller's own signature-verified access token,
 * so the backend applies exactly the permissions that user already has. Nothing
 * about being routed through the copilot grants extra reach; a TEACHER who
 * cannot record a payment by hand still gets the backend's 403 here.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only a currently-valid signature may drive a write. An expired token is
  // authentic but stale: 401 lets the client refresh and retry, which is the
  // same answer the backend would give.
  const verified = await verifyAccessToken(accessToken);
  if (verified.status !== 'valid') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, payload } = (body ?? {}) as { action?: unknown; payload?: unknown };

  if (!isAiActionName(action)) {
    // Deliberately does not echo the rejected name back into the response.
    serverLogger.warn('[AI action] rejected unknown action');
    return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  }

  const definition = AI_ACTIONS[action];
  const parsed = definition.schema.safeParse(payload);

  if (!parsed.success) {
    serverLogger.warn(`[AI action] ${action} payload failed validation`);
    return NextResponse.json(
      { message: 'Invalid payload for this action' },
      { status: 400 },
    );
  }

  // Backend has a global `/api` prefix (NestJS setGlobalPrefix('api')), the same
  // shape the middleware proxy builds.
  const target = `${BACKEND_URL.replace(/\/$/, '')}/api/${definition.path}`;

  try {
    const res = await fetch(target, {
      method: definition.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      // parsed.data, not the raw payload: anything the schema did not declare
      // is dropped rather than forwarded.
      body: JSON.stringify(parsed.data),
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      serverLogger.warn(`[AI action] ${action} -> backend ${res.status}`);
    }

    // Pass the backend's own status through, so 403 stays 403 and the copilot
    // can say "administrators only" rather than a generic failure.
    return NextResponse.json(
      res.ok ? { ok: true, action, result: data } : { message: 'Action failed', status: res.status },
      { status: res.status },
    );
  } catch (err) {
    serverLogger.error(`[AI action] ${action} network error:`, err);
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

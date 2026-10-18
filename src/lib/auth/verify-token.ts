import { jwtVerify, errors } from 'jose';
import { JWT_ACCESS_SECRET } from '@/lib/server-env';
import type { UserRole } from '@/types/auth';

/**
 * Server-side access-token verification for UI route protection.
 *
 * The access token is an HS256 JWT minted by the backend. Middleware and server
 * components must VERIFY its signature — not merely base64-decode it — before
 * trusting any claim such as the user role. A forged or hand-edited cookie must
 * never grant access to a role-gated UI route. (Real data access is always
 * enforced by the backend; this guards the UI layer.)
 */

const secret = new TextEncoder().encode(JWT_ACCESS_SECRET);

export interface AccessClaims {
  /** JWT subject — the user id. Null only if the backend omitted it. */
  sub: string | null;
  role: UserRole | null;
  organization_id: string | null;
  /** Present only for account-backed tenant sessions that require live revocation checks. */
  session_id?: string;
}

export type VerifyResult =
  | { status: 'valid'; claims: AccessClaims }
  | { status: 'expired'; claims: AccessClaims }
  | { status: 'invalid' };

function toClaims(payload: Record<string, unknown>): AccessClaims | null {
  if (Object.hasOwn(payload, 'session_id')
    && (typeof payload.session_id !== 'string' || payload.session_id.length === 0 || payload.session_id.length > 128)) return null;
  return {
    sub: typeof payload.sub === 'string' ? payload.sub : null,
    role: (payload.role as UserRole) ?? null,
    organization_id: (payload.organization_id as string) ?? null,
    ...(typeof payload.session_id === 'string' ? { session_id: payload.session_id } : {}),
  };
}

export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  // Fail closed when the secret is not provisioned: never trust an unverifiable
  // token. Callers treat 'invalid' as "no role", so role-gated routes deny.
  if (!JWT_ACCESS_SECRET) {
    return { status: 'invalid' };
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    const claims = toClaims(payload as Record<string, unknown>);
    return claims ? { status: 'valid', claims } : { status: 'invalid' };
  } catch (err) {
    // An expired token still passed signature verification, so its claims are
    // authentic. Surface them separately so the caller can keep enforcing the
    // real role while the client silently refreshes the token.
    if (err instanceof errors.JWTExpired) {
      const claims = toClaims(err.payload as Record<string, unknown>);
      return claims ? { status: 'expired', claims } : { status: 'invalid' };
    }
    // Bad signature / malformed / wrong algorithm → untrusted.
    return { status: 'invalid' };
  }
}

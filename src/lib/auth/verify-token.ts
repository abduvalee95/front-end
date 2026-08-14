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
}

export type VerifyResult =
  | { status: 'valid'; claims: AccessClaims }
  | { status: 'expired'; claims: AccessClaims }
  | { status: 'invalid' };

function toClaims(payload: Record<string, unknown>): AccessClaims {
  return {
    sub: typeof payload.sub === 'string' ? payload.sub : null,
    role: (payload.role as UserRole) ?? null,
    organization_id: (payload.organization_id as string) ?? null,
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
    return { status: 'valid', claims: toClaims(payload as Record<string, unknown>) };
  } catch (err) {
    // An expired token still passed signature verification, so its claims are
    // authentic. Surface them separately so the caller can keep enforcing the
    // real role while the client silently refreshes the token.
    if (err instanceof errors.JWTExpired) {
      return {
        status: 'expired',
        claims: toClaims(err.payload as Record<string, unknown>),
      };
    }
    // Bad signature / malformed / wrong algorithm → untrusted.
    return { status: 'invalid' };
  }
}

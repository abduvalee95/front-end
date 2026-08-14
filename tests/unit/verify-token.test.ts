import { describe, expect, it, beforeAll } from 'vitest';
import { SignJWT } from 'jose';

/**
 * Access-token verification.
 *
 * The whole point of this module is that a cookie is not trusted because it
 * exists — it is trusted because it verifies. Middleware reads the role out of
 * the result and gates routes on it, so "invalid" has to mean no role rather
 * than a role nobody checked.
 *
 * The secret is set before the module loads: server-env reads it at import
 * time, so a later assignment would arrive after the module has already made
 * up its mind.
 */

const SECRET = 'unit-test-signing-secret';
process.env.JWT_ACCESS_SECRET = SECRET;

let verifyAccessToken: typeof import('@/lib/auth/verify-token').verifyAccessToken;

beforeAll(async () => {
  ({ verifyAccessToken } = await import('@/lib/auth/verify-token'));
});

const key = () => new TextEncoder().encode(SECRET);

async function sign(claims: Record<string, unknown>, expiry = '5m', secret = SECRET) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(new TextEncoder().encode(secret));
}

describe('verifyAccessToken', () => {
  it('accepts a correctly signed token and surfaces its claims', async () => {
    const token = await sign({ sub: 'u1', role: 'ADMIN', organization_id: 'org1' });
    const result = await verifyAccessToken(token);

    expect(result.status).toBe('valid');
    if (result.status !== 'invalid') {
      expect(result.claims).toEqual({ sub: 'u1', role: 'ADMIN', organization_id: 'org1' });
    }
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await sign({ sub: 'u1', role: 'ADMIN' }, '5m', 'a-different-secret');
    expect((await verifyAccessToken(token)).status).toBe('invalid');
  });

  it('rejects a token whose payload was edited after signing', async () => {
    // The classic escalation attempt: keep the signature, swap the role.
    const token = await sign({ sub: 'u1', role: 'TEACHER' });
    const [header, , signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'u1', role: 'SUPER_ADMIN' }))
      .toString('base64url');

    const result = await verifyAccessToken(`${header}.${forged}.${signature}`);
    expect(result.status).toBe('invalid');
  });

  it('separates expiry from forgery, because an expired token is still authentic', async () => {
    const token = await new SignJWT({ sub: 'u1', role: 'MANAGER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(key());

    const result = await verifyAccessToken(token);

    // 'expired' keeps the real role so the client can refresh instead of being
    // bounced; only 'invalid' means "no role at all".
    expect(result.status).toBe('expired');
    if (result.status === 'expired') {
      expect(result.claims.role).toBe('MANAGER');
    }
  });

  it('rejects malformed input rather than throwing', async () => {
    for (const bad of ['', 'not.a.token', 'a.b', '...']) {
      expect((await verifyAccessToken(bad)).status).toBe('invalid');
    }
  });

  it('reports null claims when the payload omits them', async () => {
    const token = await sign({});
    const result = await verifyAccessToken(token);
    if (result.status !== 'invalid') {
      expect(result.claims).toEqual({ sub: null, role: null, organization_id: null });
    }
  });
});

describe('verifyAccessToken with an unsigned algorithm', () => {
  it('refuses alg:none', async () => {
    // `none` is the oldest JWT trick there is: no signature, and a verifier
    // that honours the header's algorithm choice accepts anything.
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'u1', role: 'SUPER_ADMIN' })).toString('base64url');

    expect((await verifyAccessToken(`${header}.${payload}.`)).status).toBe('invalid');
  });
});

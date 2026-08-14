import { describe, expect, it } from 'vitest';
import { canAccess, ROUTE_ROLES } from '@/lib/rbac';

/**
 * Route permissions.
 *
 * canAccess is prefix-matched, which is what makes it worth testing: the same
 * property that lets /finance cover /finance/invoices also means a new route
 * whose name merely starts with a restricted one inherits that restriction by
 * accident.
 */
describe('canAccess', () => {
  it('denies every route when there is no role', () => {
    // A forged or malformed token yields a null role. It must not read as
    // "unrestricted" simply because the route carries no explicit entry.
    expect(canAccess('/finance', null)).toBe(false);
    expect(canAccess('/dashboard', null)).toBe(false);
    expect(canAccess('/anything-unlisted', undefined)).toBe(false);
  });

  it('allows an unlisted route to any authenticated role', () => {
    expect(canAccess('/dashboard', 'TEACHER')).toBe(true);
    expect(canAccess('/groups', 'TEACHER')).toBe(true);
  });

  it('enforces the listed restrictions', () => {
    expect(canAccess('/finance', 'ADMIN')).toBe(true);
    expect(canAccess('/finance', 'MANAGER')).toBe(true);
    expect(canAccess('/finance', 'TEACHER')).toBe(false);

    expect(canAccess('/admin', 'SUPER_ADMIN')).toBe(true);
    expect(canAccess('/admin', 'ADMIN')).toBe(false);

    expect(canAccess('/users', 'ADMIN')).toBe(true);
    expect(canAccess('/users', 'MANAGER')).toBe(false);
  });

  it('extends a restriction to nested paths', () => {
    expect(canAccess('/finance/invoices/42', 'TEACHER')).toBe(false);
    expect(canAccess('/admin/organizations/1', 'ADMIN')).toBe(false);
  });

  it('rejects an unknown role rather than defaulting to permitted', () => {
    expect(canAccess('/finance', 'STUDENT')).toBe(false);
    expect(canAccess('/finance', 'root')).toBe(false);
  });

  it('has no restricted route that permits every role', () => {
    // A rule listing all four roles is dead weight pretending to be a gate.
    for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
      expect(roles.length, `${route} lists every role, so it restricts nothing`).toBeLessThan(4);
    }
  });
});

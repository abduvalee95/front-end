// Single source of truth for all role/permission definitions
export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] as const;
export type Role = (typeof ROLES)[number];

// Routes restricted to specific roles. Unlisted routes = any authenticated user can access.
export const ROUTE_ROLES: Record<string, Role[]> = {
  '/leads':     ['ADMIN', 'MANAGER'],
  '/finance':   ['ADMIN', 'MANAGER'],
  '/reports':   ['ADMIN', 'MANAGER'],
  '/teachers':  ['ADMIN', 'MANAGER'],
  '/analytics': ['ADMIN', 'MANAGER'],
  '/subjects':  ['ADMIN', 'MANAGER'],
  '/admin':     ['SUPER_ADMIN'],
  '/users':     ['SUPER_ADMIN', 'ADMIN'],
};

export function canAccess(pathname: string, role: string | null | undefined): boolean {
  if (!role) return false;
  const entry = Object.entries(ROUTE_ROLES).find(([route]) => pathname.startsWith(route));
  if (!entry) return true; // no restriction
  return (entry[1] as string[]).includes(role);
}

/**
 * JWT Utility Functions
 * Centralized logic for decoding and extracting info from tokens
 */

import { UserRole } from '@/types/auth';

/**
 * Decodes a JWT payload without verifying the signature
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    // Cross-environment base64 decoding (Works in Browser and Node.js)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Safely extracts the user role from an access token
 */
export function getRoleFromToken(token: string): UserRole | null {
  const payload = decodeJwtPayload(token);
  return (payload?.role as UserRole) ?? null;
}

/**
 * Extracts organization ID from token
 */
export function getOrgIdFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  return (payload?.organization_id as string) ?? null;
}

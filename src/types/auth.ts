/**
 * Authentication Types
 * Enterprise SaaS Grade Type Definitions
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  organization_name?: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  access_token?: string; // Only if backend returns in body (we use cookies)
  refresh_token?: string; // Only if backend returns in body (we use cookies)
}

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
}

export interface MeResponse {
  user: User;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  isHydrated: boolean;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  organization_id?: string;
  iat: number;
  exp: number;
}

export interface TokenConfig {
  access: {
    cookieName: string;
    ttlSeconds: number;
    ttlMs: number;
    refreshBeforeMs: number;
  };
  refresh: {
    cookieName: string;
    ttlSeconds: number;
    ttlMs: number;
  };
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge?: number;
}

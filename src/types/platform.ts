/**
 * Platform / Super Admin Types
 * Mirrors backend DTOs exactly — no invented fields.
 */

import { UserRole } from './auth';

// Re-export shared auth types from canonical source
export type { UserRole } from './auth';

// --- Enums ---
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE';

// --- List Response (GET /platform/organizations) ---

export interface PlatformOrganization {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
  usersCount: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedOrganizationsResponse {
  items: PlatformOrganization[];
  meta: PaginationMeta;
}

// --- Query Params (GET /platform/organizations) ---

export interface OrganizationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrganizationStatus;
}

// --- Create (POST /platform/register) ---

export interface CreateOrganizationPayload {
  Org_name: string;
  Org_email: string;
  Org_status?: OrganizationStatus;
  adminEmail: string;
  adminName: string;
  phone: string;
  password: string;
  adminRole: UserRole;
}

export interface RegisterOrganizationResponse {
  organization_id: string;
  Org_name: string;
  Org_status: OrganizationStatus;
  Org_email: string;
  id: string;
  adminEmail: string;
  adminName: string;
  phone: string;
  adminRole: UserRole;
  created_at: string;
}

// --- Update (PATCH /platform/:id) ---

export interface UpdateOrganizationPayload {
  name?: string;
  email?: string;
  phone?: string;
  status?: OrganizationStatus;
  telegram_chat_id?: string;
  whatsapp_target?: string;
}

// --- Status Toggle (PATCH /platform/organizations/:id/status) ---

export interface UpdateStatusPayload {
  status: OrganizationStatus;
}

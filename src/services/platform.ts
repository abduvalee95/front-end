/**
 * Platform Service Layer
 * All Super Admin API calls go through /api/proxy/ to forward auth cookies.
 */

import { api } from '@/lib/api/client';
import type {
  PaginatedOrganizationsResponse,
  OrganizationQueryParams,
  CreateOrganizationPayload,
  RegisterOrganizationResponse,
  UpdateOrganizationPayload,
  UpdateStatusPayload,
  PlatformOrganization,
} from '@/types/platform';

const BASE = '/proxy/platform';

export const platformService = {
  /** GET /platform/organizations — paginated list */
  listOrganizations(params: OrganizationQueryParams) {
    return api
      .get<PaginatedOrganizationsResponse>(`${BASE}/organizations`, { params })
      .then((r) => r.data);
  },

  /** POST /platform/register — create org + admin */
  createOrganization(payload: CreateOrganizationPayload) {
    return api
      .post<RegisterOrganizationResponse>(`${BASE}/register`, payload)
      .then((r) => r.data);
  },

  /** PATCH /platform/:id — update organization fields */
  updateOrganization(id: string, payload: UpdateOrganizationPayload) {
    return api
      .patch<PlatformOrganization>(`${BASE}/${id}`, payload)
      .then((r) => r.data);
  },

  /** PATCH /platform/organizations/:id/status — toggle active/inactive */
  updateOrganizationStatus(id: string, payload: UpdateStatusPayload) {
    return api
      .patch<PlatformOrganization>(
        `${BASE}/organizations/${id}/status`,
        payload,
      )
      .then((r) => r.data);
  },
};

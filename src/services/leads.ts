/**
 * Lead service — dedicated service for lead operations
 * Extracted from analyticsService for better separation of concerns
 */

import { api } from '@/lib/api/client';
import type {
  CreateLeadDto,
  CreateLeadResponse,
  PaginatedLeads,
  Lead,
  LeadStatus,
} from '@/types/analytics';

export interface LeadFilters {
  status?: LeadStatus;
  source?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface LeadListParams extends LeadFilters {
  page?: number;
  limit?: number;
}

export interface UpdateLeadDto {
  status?: LeadStatus;
  full_name?: string;
  phone?: string;
  source?: string;
}

export const leadService = {
  /**
   * List leads with pagination and filters
   */
  listLeads(params: LeadListParams): Promise<PaginatedLeads> {
    return api
      .get<PaginatedLeads>('proxy/lead', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 50,
          ...params,
        },
      })
      .then((r) => r.data);
  },

  /**
   * Get single lead by ID
   */
  getLead(id: string): Promise<Lead> {
    return api.get<Lead>(`proxy/lead/${id}`).then((r) => r.data);
  },

  /**
   * Create new lead
   */
  createLead(data: CreateLeadDto): Promise<CreateLeadResponse> {
    return api.post<CreateLeadResponse>('proxy/lead', data).then((r) => r.data);
  },

  /**
   * Update lead (status, contact info, etc.)
   */
  updateLead(id: string, data: UpdateLeadDto): Promise<Lead> {
    return api.patch<Lead>(`proxy/lead/${id}`, data).then((r) => r.data);
  },

  /**
   * Delete lead
   */
  deleteLead(id: string): Promise<void> {
    return api.delete(`proxy/lead/${id}`).then(() => undefined);
  },

  /**
   * Convert lead to student (transaction: Lead + User + Student)
   */
  convertToStudent(id: string): Promise<{ message: string; student_id: string }> {
    return api.post(`proxy/lead/${id}/convert`).then((r) => r.data);
  },
};

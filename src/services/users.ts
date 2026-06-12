import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { User, UserRole } from '@/types/auth';

export interface PaginatedUsersResponse {
  items: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  is_active?: boolean;
}

const BASE_URL = 'proxy/organizations/users';

export interface UpdateSelfPayload {
  /** Backend DTO requires phone on every update */
  phone: string;
  full_name?: string;
  email?: string;
  /** Current password — required when setting new_password */
  password?: string;
  new_password?: string;
  confirm_new_password?: string;
}

export const userService = {
  /**
   * Get paginated users for the organization
   */
  async getUsers(params?: UserQueryParams, endpoint?: string): Promise<PaginatedUsersResponse> {
    const url = endpoint || BASE_URL;
    const response = await api.get(url, {
      params,
    });
    logger.debug('USERS FETCH RESPONSE:', response.data);
    
    const result = response.data;
    
    return {
      items: result.items || result.data || [],
      meta: result.meta || { total: 0, page: 1, limit: 10, pages: 1 }
    };
  },

  /**
   * Update the logged-in user's own profile / password.
   * Backend verifies the current password and clears the refresh token
   * after a password change (forces re-login).
   */
  async updateSelf(payload: UpdateSelfPayload): Promise<User> {
    const response = await api.post<User>('proxy/user/update', payload);
    return response.data;
  },

  /**
   * Update a user (e.g. status or role)
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a user from organization
   */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

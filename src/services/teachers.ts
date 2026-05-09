import { api } from '@/lib/api/client';
import { 
  CreateTeacherDto, 
  UpdateTeacherDto, 
  PaginatedTeachersResponse, 
  TeacherProfile,
  TeacherStatus
} from '@/types/teacher';

const TEACHERS_BASE_URL = '/proxy/teachers';

export const teacherService = {
  /**
   * Get paginated teachers
   */
  async getTeachers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedTeachersResponse> {
    const response = await api.get<PaginatedTeachersResponse>(TEACHERS_BASE_URL, {
      params,
    });
    return response.data;
  },

  /**
   * Get single teacher by ID
   */
  async getTeacherById(id: string): Promise<TeacherProfile> {
    const response = await api.get<TeacherProfile>(`${TEACHERS_BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create a new teacher
   */
  async createTeacher(data: CreateTeacherDto): Promise<TeacherProfile> {
    const response = await api.post<TeacherProfile>(TEACHERS_BASE_URL, data);
    return response.data;
  },

  /**
   * Update a teacher
   */
  async updateTeacher(id: string, data: UpdateTeacherDto): Promise<TeacherProfile> {
    const response = await api.patch<TeacherProfile>(`${TEACHERS_BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Toggle teacher status
   */
  async toggleStatus(id: string, status: TeacherStatus): Promise<TeacherProfile> {
    const response = await api.patch<TeacherProfile>(`${TEACHERS_BASE_URL}/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Delete a teacher
   */
  async deleteTeacher(id: string): Promise<void> {
    await api.delete(`${TEACHERS_BASE_URL}/${id}`);
  },

  /**
   * Bulk create teachers
   */
  async bulkCreate(data: CreateTeacherDto[]): Promise<{ count: number }> {
    const response = await api.post(`${TEACHERS_BASE_URL}/bulk`, { teachers: data });
    return response.data;
  },
};

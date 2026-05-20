import { api } from '@/lib/api/client';
import type {
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherProfile,
  TeacherListResponse,
  TeacherStatus,
  TeacherFilters,
  TeacherSalaryPreview,
  TeacherSalaryRecord,
} from '@/types/teacher';

const BASE = 'proxy/teachers';

export const teacherService = {
  async getTeachers(params?: TeacherFilters): Promise<TeacherListResponse> {
    const response = await api.get<TeacherListResponse>(BASE, { params });
    return response.data;
  },

  async getTeacherById(id: string): Promise<TeacherProfile> {
    const response = await api.get<TeacherProfile>(`${BASE}/${id}`);
    return response.data;
  },

  async createTeacher(data: CreateTeacherDto): Promise<TeacherProfile> {
    const response = await api.post<TeacherProfile>(BASE, data);
    return response.data;
  },

  async updateTeacher(id: string, data: UpdateTeacherDto): Promise<TeacherProfile> {
    const response = await api.patch<TeacherProfile>(`${BASE}/${id}`, data);
    return response.data;
  },

  async toggleStatus(id: string, status: TeacherStatus): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`${BASE}/${id}/status`, { status });
    return response.data;
  },

  async deleteTeacher(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`${BASE}/${id}`);
    return response.data;
  },

  async getDeletedTeachers(params?: { page?: number; limit?: number; search?: string }): Promise<TeacherListResponse> {
    const response = await api.get<TeacherListResponse>(`${BASE}/deleted`, { params });
    return response.data;
  },

  async getSalaryPreview(teacherId: string, month: string): Promise<TeacherSalaryPreview> {
    const response = await api.get<TeacherSalaryPreview>(`${BASE}/${teacherId}/salary?month=${month}`);
    return response.data;
  },

  async getSalaryHistory(teacherId: string): Promise<TeacherSalaryRecord[]> {
    const response = await api.get<TeacherSalaryRecord[]>(`${BASE}/${teacherId}/salary/history`);
    return response.data;
  },

  async paySalary(teacherId: string, month: string): Promise<TeacherSalaryRecord> {
    const response = await api.post<TeacherSalaryRecord>(`${BASE}/${teacherId}/salary/pay`, { month });
    return response.data;
  },
};

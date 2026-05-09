import { api } from '@/lib/api/client';
import type {
  Enrollment,
  GroupSummary,
  PaginatedStudentsResponse,
  Student,
  StudentQueryParams,
} from '@/types/student';

const STUDENTS_BASE_URL = '/proxy/student';
const GROUPS_BASE_URL = '/proxy/groups';
const ENROLLMENT_BASE_URL = '/proxy/enrollment';

export const studentService = {
  async getStudents(params?: StudentQueryParams): Promise<PaginatedStudentsResponse> {
    const response = await api.get<PaginatedStudentsResponse>(STUDENTS_BASE_URL, { params });
    return response.data;
  },

  async getGroups(): Promise<GroupSummary[]> {
    const response = await api.get<GroupSummary[]>(GROUPS_BASE_URL);
    return response.data;
  },

  async getEnrollmentsByGroup(groupId: string): Promise<Enrollment[]> {
    const response = await api.get<Enrollment[]>(`${ENROLLMENT_BASE_URL}/group/${groupId}`);
    return response.data;
  },

  async createStudent(data: Partial<Student>): Promise<{ student: Student; user: any; temporaryPassword?: string }> {
    const response = await api.post(STUDENTS_BASE_URL, data);
    return response.data;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const response = await api.patch(`${STUDENTS_BASE_URL}/${id}`, data);
    return response.data;
  },

  async deleteStudent(id: string): Promise<void> {
    const response = await api.delete(`${STUDENTS_BASE_URL}/${id}`);
    return response.data;
  },

  async bulkCreate(data: any[]): Promise<{ count: number }> {
    const response = await api.post(`${STUDENTS_BASE_URL}/bulk`, { students: data });
    return response.data;
  },
};

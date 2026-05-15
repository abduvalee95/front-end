import { api } from '@/lib/api/client';
import type {
  BulkCreateStudentDto,
  CreateStudentResponse,
  Enrollment,
  GroupSummary,
  PaginatedStudentsResponse,
  Student,
  StudentQueryParams,
  StudentStatistics,
} from '@/types/student';

const STUDENTS_BASE_URL = 'proxy/student';
const GROUPS_BASE_URL = 'proxy/groups';
const ENROLLMENT_BASE_URL = 'proxy/enrollment';

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

  async getStudentById(id: string): Promise<Student> {
    const response = await api.get<Student>(`${STUDENTS_BASE_URL}/${id}`);
    return response.data;
  },

  async createStudent(data: Partial<Student>): Promise<CreateStudentResponse> {
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

  async bulkCreate(data: BulkCreateStudentDto[]): Promise<{ count: number }> {
    const response = await api.post(`${STUDENTS_BASE_URL}/bulk`, { students: data });
    return response.data;
  },

  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    const response = await api.get<Enrollment[]>(`${ENROLLMENT_BASE_URL}/student/${studentId}`);
    return response.data;
  },

  async getStatistics(): Promise<StudentStatistics> {
    const response = await api.get<StudentStatistics>(`${STUDENTS_BASE_URL}/statistics`);
    return response.data;
  },
};

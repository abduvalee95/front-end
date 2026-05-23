import { api } from '@/lib/api/client';
import type { Enrollment } from '@/types/student';

const ENROLLMENT_URL = 'proxy/enrollment';

export interface CreateEnrollmentPayload {
  student_id: string;
  group_id: string;
  monthly_fee?: number;
  discount_amount?: number;
}

export interface UpdateEnrollmentPayload {
  monthly_fee?: number;
  discount_amount?: number;
}

export const enrollmentService = {
  async getByGroup(groupId: string): Promise<Enrollment[]> {
    const response = await api.get<Enrollment[]>(`${ENROLLMENT_URL}/group/${groupId}`);
    return response.data;
  },

  async getByStudent(studentId: string): Promise<Enrollment[]> {
    const response = await api.get<Enrollment[]>(`${ENROLLMENT_URL}/student/${studentId}`);
    return response.data;
  },

  async create(data: CreateEnrollmentPayload): Promise<Enrollment> {
    const response = await api.post<Enrollment>(ENROLLMENT_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateEnrollmentPayload): Promise<Enrollment> {
    const response = await api.patch<Enrollment>(`${ENROLLMENT_URL}/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`${ENROLLMENT_URL}/${id}`);
  },
};

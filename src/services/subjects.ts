import { api } from '@/lib/api/client';
import type { Subject, CreateSubjectPayload, UpdateSubjectPayload } from '@/types/subject';

const SUBJECTS_URL = 'proxy/subject';

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>(SUBJECTS_URL);
    return response.data;
  },

  async createSubject(data: CreateSubjectPayload): Promise<Subject> {
    const response = await api.post<Subject>(SUBJECTS_URL, data);
    return response.data;
  },

  async updateSubject(id: string, data: UpdateSubjectPayload): Promise<Subject> {
    const response = await api.patch<Subject>(`${SUBJECTS_URL}/${id}`, data);
    return response.data;
  },

  async deleteSubject(id: string): Promise<void> {
    await api.delete(`${SUBJECTS_URL}/${id}`);
  },
};

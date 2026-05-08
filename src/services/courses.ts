import { api } from '@/lib/api/client';
import type { Course, CreateCoursePayload, UpdateCoursePayload } from '@/types/group';

const COURSES_URL = '/proxy/courses';

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const response = await api.get<Course[]>(COURSES_URL);
    return response.data;
  },

  async createCourse(data: CreateCoursePayload): Promise<Course> {
    const response = await api.post<Course>(COURSES_URL, data);
    return response.data;
  },

  async updateCourse(id: string, data: UpdateCoursePayload): Promise<Course> {
    const response = await api.patch<Course>(`${COURSES_URL}/${id}`, data);
    return response.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`${COURSES_URL}/${id}`);
  },
};

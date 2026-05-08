import { User } from './auth';

export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface TeacherProfile {
  id: string;
  user_id: string;
  subjects: string[];
  hourly_rate?: number;
  qualifications?: string;
  bio?: string;
  status: TeacherStatus;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Teacher = User with role TEACHER + optional teacher_profile
export interface Teacher {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'TEACHER';
  created_at: string;
  updated_at: string;
  teacher_profile?: TeacherProfile;
  organization_name?: string;
}

export interface CreateTeacherDto {
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  password?: string;
  subjects: string[];
  hourly_rate?: number;
  qualifications?: string;
  bio?: string;
}

export interface UpdateTeacherDto {
  full_name?: string;
  email?: string;
  phone?: string;
  subjects?: string[];
  hourly_rate?: number;
  qualifications?: string;
  bio?: string;
  status?: TeacherStatus;
}

export interface PaginatedTeachersResponse {
  items: TeacherProfile[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TeachersResponse {
  items: Teacher[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TeacherFilters {
  search?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}

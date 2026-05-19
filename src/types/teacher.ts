export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'DELETED';

export const TEACHER_SUBJECTS = [
  'ENGLISH',
  'IT',
  'MATH',
  'PHYSICS',
  'HISTORY',
  'CHEMISTRY',
  'UZBEK_LANGUAGE',
  'RUSSIAN_LANGUAGE',
  'ART',
  'MUSIC',
  'SPORT',
  'DRAMA',
  'DANCE',
] as const;

export type TeacherSubject = (typeof TEACHER_SUBJECTS)[number];

/**
 * Backend /teachers endpoint returns a flat object:
 * User fields + TeacherProfile fields merged together.
 */
export type SalaryType = 'MONTHLY' | 'DAILY';

export interface TeacherProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'TEACHER';
  organization_id: string;
  subjects: string[];
  hourly_rate: number | null;
  salary_type: SalaryType;
  qualifications: string | null;
  bio: string | null;
  status: TeacherStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTeacherDto {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  subjects: string[];
  hourly_rate?: number;
  salary_type?: SalaryType;
  qualifications?: string;
  bio?: string;
}

export interface UpdateTeacherDto {
  full_name?: string;
  phone?: string;
  subjects?: string[];
  hourly_rate?: number;
  salary_type?: SalaryType;
  qualifications?: string;
  bio?: string;
  status?: TeacherStatus;
}

export interface TeacherListResponse {
  teachers: TeacherProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TeacherFilters {
  search?: string;
  subject?: string;
  status?: string;
  page?: number;
  limit?: number;
}

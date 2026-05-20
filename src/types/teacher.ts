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
export type SalaryType = 'MONTHLY' | 'DAILY' | 'HOURLY' | 'FIXED' | 'GROUP_PERCENT';

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
  fixed_salary: number | null;
  percent_rate: number | null;
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
  fixed_salary?: number;
  percent_rate?: number;
  qualifications?: string;
  bio?: string;
}

export interface UpdateTeacherDto {
  full_name?: string;
  phone?: string;
  subjects?: string[];
  hourly_rate?: number;
  salary_type?: SalaryType;
  fixed_salary?: number;
  percent_rate?: number;
  qualifications?: string;
  bio?: string;
  status?: TeacherStatus;
}

export interface TeacherSalaryPreview {
  teacher_id: string;
  period: string;
  salary_type: SalaryType;
  amount: number;
  breakdown: Record<string, unknown>;
}

export interface TeacherSalaryRecord {
  id: string;
  teacher_id: string;
  period: string;
  salary_type: SalaryType;
  amount: number;
  status: 'PENDING' | 'PAID';
  paid_at: string | null;
  breakdown: Record<string, unknown>;
  created_at: string;
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

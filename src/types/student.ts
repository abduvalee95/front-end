export type StudentStatus = 'ACTIVE' | 'INACTIVE';

export interface Student {
  id: string;
  name: string;
  phone: string;
  address: string;
  parent?: string;
  status: StudentStatus;
  organization_id: string;
}

export interface PaginatedStudentsResponse {
  items: Student[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StudentStatus;
}

export interface GroupSummary {
  id: string;
  name: string;
  teacher_id: string;
  course_id: string;
  start_date: string;
  end_date: string;
  course?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    full_name: string;
  };
}

export interface CreateStudentDto {
  name: string;
  phone: string;
  address?: string;
  parent?: string;
  status?: StudentStatus;
}

export interface BulkCreateStudentDto {
  name: string;
  phone: string;
  address?: string;
  parent?: string;
}

export interface CreateStudentResponse {
  student: Student;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    role: string;
  };
  temporaryPassword?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  group_id: string;
  enrolled_at: string;
  monthly_fee?: string;
  discount_amount?: string;
  student?: Pick<Student, 'id' | 'name' | 'phone' | 'status'>;
  group?: {
    id: string;
    name: string;
    course?: {
      id: string;
      title: string;
    };
    teacher?: {
      id: string;
      full_name: string;
    };
  };
}

export interface StudentDetailEnrollment {
  id: string;
  group_id: string;
  enrolled_at: string;
  monthly_fee: string;
  discount_amount: string;
  billing_active: boolean;
  group: {
    id: string;
    name: string;
    course: {
      id: string;
      title: string;
      price: string;
    } | null;
    teacher: {
      id: string;
      full_name: string;
    } | null;
  };
}

export interface StudentDetail extends Student {
  expected_monthly_fee: string;
  paid_current_month: string;
  enrollments: StudentDetailEnrollment[];
}

export interface StudentStatistics {
  total: number;
  active: number;
  inactive: number;
  enrollmentCount: number;
}

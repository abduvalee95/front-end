// ─── Course ───
export type CourseStatus = 'ACTIVE' | 'INACTIVE';

export interface Course {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  price: string;
  status: CourseStatus;
  created_at: string;
}

export interface CreateCoursePayload {
  title: string;
  description?: string;
  price: string;
  status?: CourseStatus;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  price?: string;
  status?: CourseStatus;
}

// ─── Group ───
export interface Group {
  id: string;
  organization_id: string;
  name: string;
  course_id: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  course?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    full_name: string;
  };
}

export interface CreateGroupPayload {
  name: string;
  course_id: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
}

export interface UpdateGroupPayload {
  name?: string;
  course_id?: string;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
}

// ─── Schedule ───
export interface GroupSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
}

export interface ScheduleItem {
  day_of_week: number;
  start_time: string;
  duration_minutes?: number;
}

export interface SetSchedulePayload {
  items: ScheduleItem[];
}

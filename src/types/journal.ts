export type JournalStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface JournalEntryResponse {
  id: string;
  organization_id: string;
  group_id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: JournalStatus;
  score: number | null;
  notes: string | null;
  student_name?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalListResponse {
  items: JournalEntryResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface JournalEntryItem {
  student_id: string;
  status: JournalStatus;
  score?: number;
  notes?: string;
}

export interface CreateJournalDto {
  group_id: string;
  date: string;
  entries: JournalEntryItem[];
}

export interface JournalQueryParams {
  group_id?: string;
  teacher_id?: string;
  student_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: JournalStatus;
  page?: number;
  limit?: number;
}

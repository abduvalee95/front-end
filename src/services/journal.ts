import { api } from '@/lib/api/client';
import type {
  CreateJournalDto,
  JournalEntryResponse,
  JournalListResponse,
  JournalQueryParams,
} from '@/types/journal';

const JOURNAL_URL = '/proxy/journal';

export const journalService = {
  async upsertEntries(data: CreateJournalDto): Promise<JournalEntryResponse[]> {
    const response = await api.post<JournalEntryResponse[]>(JOURNAL_URL, data);
    return response.data;
  },

  async findAll(params?: JournalQueryParams): Promise<JournalListResponse> {
    const response = await api.get<JournalListResponse>(JOURNAL_URL, { params });
    return response.data;
  },

  async findByGroup(groupId: string, params?: JournalQueryParams): Promise<JournalListResponse> {
    const response = await api.get<JournalListResponse>(`${JOURNAL_URL}/groups/${groupId}`, { params });
    return response.data;
  },

  async findByTeacher(teacherId: string, params?: JournalQueryParams): Promise<JournalListResponse> {
    const response = await api.get<JournalListResponse>(`${JOURNAL_URL}/teachers/${teacherId}`, { params });
    return response.data;
  },
};

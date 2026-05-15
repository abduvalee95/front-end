import { api } from '@/lib/api/client';
import type {
  Group,
  CreateGroupPayload,
  UpdateGroupPayload,
  GroupSchedule,
  SetSchedulePayload,
} from '@/types/group';

const GROUPS_URL = 'proxy/groups';

export const groupService = {
  async getGroups(): Promise<Group[]> {
    const response = await api.get<Group[]>(GROUPS_URL);
    return response.data;
  },

  async getGroupById(id: string): Promise<Group> {
    const response = await api.get<Group>(`${GROUPS_URL}/${id}`);
    return response.data;
  },

  async createGroup(data: CreateGroupPayload): Promise<Group> {
    const response = await api.post<Group>(GROUPS_URL, data);
    return response.data;
  },

  async updateGroup(id: string, data: UpdateGroupPayload): Promise<Group> {
    const response = await api.patch<Group>(`${GROUPS_URL}/${id}`, data);
    return response.data;
  },

  async deleteGroup(id: string): Promise<void> {
    await api.delete(`${GROUPS_URL}/${id}`);
  },

  async getSchedule(groupId: string): Promise<GroupSchedule[]> {
    const response = await api.get<GroupSchedule[]>(`${GROUPS_URL}/${groupId}/schedule`);
    return response.data;
  },

  async setSchedule(groupId: string, data: SetSchedulePayload): Promise<GroupSchedule[]> {
    const response = await api.put<GroupSchedule[]>(`${GROUPS_URL}/${groupId}/schedule`, data);
    return response.data;
  },
};

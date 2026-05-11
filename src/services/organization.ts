import { api } from '@/lib/api/client';

export interface OrganizationSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  telegram_enabled: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  whatsapp_enabled: boolean;
  whatsapp_cloud_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_api_version?: string;
  whatsapp_cloud_base_url?: string;
  whatsapp_target?: string;
  created_at: string;
}

export const organizationService = {
  getSettings: async (): Promise<OrganizationSettings> => {
    const { data } = await api.get<OrganizationSettings>('/proxy/organizations/settings');
    return data;
  },

  updateSettings: async (payload: Partial<OrganizationSettings>): Promise<OrganizationSettings> => {
    const { data } = await api.patch<OrganizationSettings>('/proxy/organizations/settings', payload);
    return data;
  }
};

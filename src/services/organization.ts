import { api } from '@/lib/api/client';

export interface OrganizationSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  logo_url?: string;
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
  },

  uploadLogo: async (file: File): Promise<{ logo_url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await api.post<{ logo_url: string }>('/proxy/organizations/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

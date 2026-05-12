'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/i18n/index';
import { 
  User, 
  Building2, 
  Globe, 
  ShieldCheck, 
  Palette, 
  Settings, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';
import { useOrganizationSettings, useUpdateOrganizationSettings, useUploadOrganizationLogo } from '@/hooks/useOrganization';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { OrganizationSettings } from '@/services/organization';

// Import new modular tab components
import { ProfileTab } from '@/components/settings/ProfileTab';
import { OrganizationTab } from '@/components/settings/OrganizationTab';
import { IntegrationsTab } from '@/components/settings/IntegrationsTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { AppearanceTab } from '@/components/settings/AppearanceTab';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { data: settings, isLoading } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();
  const uploadLogo = useUploadOrganizationLogo();
  const user = useAuthStore((state) => state.user);

  const settingsNav = [
    { id: 'profile', label: t('profile'), icon: User, desc: t('profile_desc') },
    { id: 'organization', label: t('organization'), icon: Building2, desc: t('organization_desc') },
    { id: 'integrations', label: t('integrations'), icon: Globe, desc: t('integrations_desc') },
    { id: 'security', label: t('security'), icon: ShieldCheck, desc: t('security_desc') },
    { id: 'appearance', label: t('appearance'), icon: Palette, desc: t('appearance_desc') },
  ];

  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{tCommon('loading')}...</p>
        </div>
      </div>
    );
  }

  const handleOrgInputChange = (field: keyof OrganizationSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrgSwitchChange = (field: keyof OrganizationSettings, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveOrganization = async () => {
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      telegram_enabled: formData.telegram_enabled,
      telegram_bot_token: formData.telegram_bot_token,
      telegram_chat_id: formData.telegram_chat_id,
      whatsapp_enabled: formData.whatsapp_enabled,
      whatsapp_cloud_token: formData.whatsapp_cloud_token,
      whatsapp_phone_number_id: formData.whatsapp_phone_number_id,
      whatsapp_target: formData.whatsapp_target,
    };
    updateSettings.mutate(payload, {
      onSuccess: () => toast.success('Organization settings saved successfully'),
      onError: () => toast.error('Failed to save settings'),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
              <Settings className="size-4" />
              <span>{t('title')}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('title')}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-72 flex-shrink-0">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {settingsNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className={`size-5 ${isActive ? 'text-primary-foreground' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isActive ? 'text-primary-foreground' : ''}`}>{item.label}</p>
                          <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/70' : 'text-slate-400'}`}>{item.desc}</p>
                        </div>
                        <ChevronRight className={`size-4 transition-transform ${isActive ? 'rotate-90 text-primary-foreground' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                profileData={profileData}
                handleProfileChange={handleProfileChange}
              />
            )}
            {activeTab === 'organization' && (
              <OrganizationTab
                formData={formData}
                settings={settings}
                handleOrgInputChange={handleOrgInputChange}
                handleSaveOrganization={handleSaveOrganization}
                updateSettingsPending={updateSettings.isPending}
                uploadLogo={uploadLogo}
                setFormData={setFormData}
              />
            )}
            {activeTab === 'integrations' && (
              <IntegrationsTab
                formData={formData}
                handleOrgInputChange={handleOrgInputChange}
                handleOrgSwitchChange={handleOrgSwitchChange}
                handleSaveOrganization={handleSaveOrganization}
                updateSettingsPending={updateSettings.isPending}
              />
            )}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'appearance' && <AppearanceTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

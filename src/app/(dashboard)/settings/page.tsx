'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import {
  User,
  Building2,
  Globe,
  ShieldCheck,
  Settings,
  ChevronRight,
  Loader2,
  Users,
  Plus,
} from 'lucide-react';
import { useOrganizationSettings, useUpdateOrganizationSettings, useUploadOrganizationLogo } from '@/hooks/useOrganization';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { OrganizationSettings } from '@/services/organization';

import { ProfileTab } from '@/components/settings/ProfileTab';
import { OrganizationTab } from '@/components/settings/OrganizationTab';
import { IntegrationsTab } from '@/components/settings/IntegrationsTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { UsersTable } from '@/components/users/UsersTable';
import { InviteUserModal } from '@/components/users/InviteUserModal';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { data: settings, isLoading } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();
  const uploadLogo = useUploadOrganizationLogo();
  const user = useAuthStore((state) => state.user);

  const isTeacher = user?.role === 'TEACHER';
  const canManageUsers = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const settingsNav = [
    { id: 'profile', label: t('profile'), icon: User, desc: t('profile_desc') },
    ...(!isTeacher ? [
      { id: 'organization', label: t('organization'), icon: Building2, desc: t('organization_desc') },
      { id: 'integrations', label: t('integrations'), icon: Globe, desc: t('integrations_desc') },
      { id: 'security', label: t('security'), icon: ShieldCheck, desc: t('security_desc') },
    ] : []),
    ...(canManageUsers ? [{ id: 'users', label: t('users'), icon: Users, desc: t('users_desc') }] : []),
  ];

  const [activeTab, setActiveTab] = useState('profile');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });

  // Adjust state during render instead of useEffect
  const [prevSettings, setPrevSettings] = useState(settings);
  if (prevSettings !== settings) {
    setPrevSettings(settings);
    if (settings) {
      setFormData(settings);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-body-sm text-muted-foreground">{tCommon('loading')}...</p>
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
    <div className="space-y-5">
      <PageHeader
        icon={Settings}
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Sidebar Navigation */}
        <div className="shrink-0 lg:w-72">
          <Card className="sticky top-6">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-5 shrink-0',
                          isActive ? 'text-primary-foreground' : 'text-muted-foreground',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-h4">{item.label}</p>
                        <p
                          className={cn(
                            'truncate text-caption font-normal',
                            isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
                          )}
                        >
                          {item.desc}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          'size-4 shrink-0 transition-transform',
                          isActive ? 'rotate-90 text-primary-foreground' : 'text-muted-foreground',
                        )}
                      />
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
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
          {activeTab === 'users' && (
            <div className="space-y-4">
              <PageHeader
                icon={Users}
                title={t('users')}
                subtitle={t('users_desc')}
                actions={
                  <Button onClick={() => setInviteModalOpen(true)}>
                    <Plus className="size-4" />
                    {t('invite_user')}
                  </Button>
                }
              />
              <UsersTable />
              <InviteUserModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

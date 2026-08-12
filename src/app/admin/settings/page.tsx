'use client';

import { useState } from 'react';
import { Settings, Server, Lock, Database, Bell, History } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '@/i18n/index';

import { PlatformSection } from '@/components/admin/settings/PlatformSection';
import { SecurityPolicySection } from '@/components/admin/settings/SecurityPolicySection';
import { InfrastructureSection } from '@/components/admin/settings/InfrastructureSection';
import { NotificationsSection } from '@/components/admin/settings/NotificationsSection';
import { AuditLogSection } from '@/components/admin/settings/AuditLogSection';

const SYSTEM_METRICS = [
  { labelKey: 'settings.api_status', value: 'OK' },
  { labelKey: 'settings.database', value: 'OK' },
  { labelKey: 'settings.avg_latency', value: '24ms' },
  { labelKey: 'settings.uptime', value: '99.98%' },
];

const recentBackups = [
  { id: 'bk1', name: 'backup_full_2024_05_11.sql', size: '1.2 GB', date: '11 May 2024, 03:00' },
  { id: 'bk2', name: 'backup_full_2024_05_10.sql', size: '1.1 GB', date: '10 May 2024, 03:00' },
  { id: 'bk3', name: 'backup_full_2024_05_09.sql', size: '1.2 GB', date: '09 May 2024, 03:00' },
];

const auditLogs = [
  { id: 'al1', action: 'Organization "ACME Corp" toggled INACTIVE', user: 'super.admin@bilimnuru.uz', time: '2 min ago' },
  { id: 'al2', action: 'New organization "EduPro" created', user: 'super.admin@bilimnuru.uz', time: '14 min ago' },
  { id: 'al3', action: 'Security policy updated (2FA enabled)', user: 'super.admin@bilimnuru.uz', time: '1 hr ago' },
  { id: 'al4', action: 'System backup triggered manually', user: 'super.admin@bilimnuru.uz', time: '2 hr ago' },
  { id: 'al5', action: 'User john@school.uz promoted to ADMIN', user: 'super.admin@bilimnuru.uz', time: '3 hr ago' },
];

const RESOURCE_METRICS = [
  { labelKey: 'settings.cpu_usage', value: 28, color: 'bg-primary' },
  { labelKey: 'settings.memory', value: 61, color: 'bg-primary' },
  { labelKey: 'settings.disk', value: 44, color: 'bg-success' },
  { labelKey: 'settings.network', value: 15, color: 'bg-warning' },
];

const NAV_ITEMS = [
  { id: 'platform' as const, labelKey: 'settings.nav_platform', icon: Server, descKey: 'settings.nav_platform_desc' },
  { id: 'security' as const, labelKey: 'settings.nav_security', icon: Lock, descKey: 'settings.nav_security_desc' },
  { id: 'infrastructure' as const, labelKey: 'settings.nav_infra', icon: Database, descKey: 'settings.nav_infra_desc' },
  { id: 'notifications' as const, labelKey: 'settings.nav_notifications', icon: Bell, descKey: 'settings.nav_notifications_desc' },
  { id: 'audit' as const, labelKey: 'settings.nav_audit', icon: History, descKey: 'settings.nav_audit_desc' },
];

type Section = (typeof NAV_ITEMS)[number]['id'];

export default function AdminSettingsPage() {
  const t = useTranslations('admin');
  const [activeSection, setActiveSection] = useState<Section>('platform');
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Platform state
  const [platformName, setPlatformName] = useState('Bilim Nuru');
  const [supportEmail, setSupportEmail] = useState('support@bilimnuru.uz');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [selfRegistration, setSelfRegistration] = useState(true);
  const [trialPeriod, setTrialPeriod] = useState('14');
  const [maxOrgs, setMaxOrgs] = useState('500');

  // Security state
  const [mandatory2FA, setMandatory2FA] = useState(false);
  const [ipWhitelisting, setIpWhitelisting] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [ipAllowlist, setIpAllowlist] = useState('');

  // Notifications state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [newOrgAlerts, setNewOrgAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleSave = async (section: string) => {
    setSavingSection(section);
    await new Promise((r) => setTimeout(r, 900));
    setSavingSection(null);
    toast.success(t('settings.settings_saved'));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary/70">
            <Settings className="size-3" /> {t('system_administration')}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('settings.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3.5 py-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-semibold text-success-emphasis">{t('all_operational')}</span>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6 items-start">
        {/* Left Sidebar */}
        <aside className="sticky top-6 w-56 shrink-0 space-y-3">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                    active
                      ? 'border border-primary/25 bg-primary/10 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.45)]'
                      : 'border border-transparent hover:bg-muted/60'
                  }`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      active ? 'bg-primary/15' : 'bg-muted group-hover:bg-muted/80'
                    }`}
                  >
                    <Icon
                      className={`size-4 ${
                        active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-bold leading-tight ${
                        active ? 'text-foreground' : 'text-foreground/80'
                      }`}
                    >
                      {t(item.labelKey)}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
                      {t(item.descKey)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Status Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(165deg,#07111f_0%,#0c2733_70%)] p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(3,203,231,0.16),transparent_8rem)]" />
            <p className="relative mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary-emphasis/60">
              {t('live_status')}
            </p>
            <div className="relative space-y-2.5">
              {SYSTEM_METRICS.map((m) => (
                <div key={m.labelKey} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{t(m.labelKey)}</span>
                  <span className="font-mono text-[11px] font-bold text-primary-emphasis">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeSection === 'platform' && (
            <PlatformSection
              platformName={platformName} setPlatformName={setPlatformName}
              supportEmail={supportEmail} setSupportEmail={setSupportEmail}
              maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode}
              selfRegistration={selfRegistration} setSelfRegistration={setSelfRegistration}
              trialPeriod={trialPeriod} setTrialPeriod={setTrialPeriod}
              maxOrgs={maxOrgs} setMaxOrgs={setMaxOrgs}
              savingSection={savingSection} handleSave={handleSave}
              systemMetrics={SYSTEM_METRICS.map((m) => ({ label: t(m.labelKey), value: m.value }))}
            />
          )}
          {activeSection === 'security' && (
            <SecurityPolicySection
              mandatory2FA={mandatory2FA} setMandatory2FA={setMandatory2FA}
              ipWhitelisting={ipWhitelisting} setIpWhitelisting={setIpWhitelisting}
              sessionTimeout={sessionTimeout} setSessionTimeout={setSessionTimeout}
              maxLoginAttempts={maxLoginAttempts} setMaxLoginAttempts={setMaxLoginAttempts}
              ipAllowlist={ipAllowlist} setIpAllowlist={setIpAllowlist}
              savingSection={savingSection} handleSave={handleSave}
            />
          )}
          {activeSection === 'infrastructure' && (
            <InfrastructureSection
              recentBackups={recentBackups}
              resourceMetrics={RESOURCE_METRICS.map((m) => ({ label: t(m.labelKey), value: m.value, color: m.color }))}
            />
          )}
          {activeSection === 'notifications' && (
            <NotificationsSection
              emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts}
              newOrgAlerts={newOrgAlerts} setNewOrgAlerts={setNewOrgAlerts}
              systemAlerts={systemAlerts} setSystemAlerts={setSystemAlerts}
              weeklyReport={weeklyReport} setWeeklyReport={setWeeklyReport}
              webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl}
              savingSection={savingSection} handleSave={handleSave}
            />
          )}
          {activeSection === 'audit' && (
            <AuditLogSection auditLogs={auditLogs} />
          )}
        </div>
      </div>
    </div>
  );
}

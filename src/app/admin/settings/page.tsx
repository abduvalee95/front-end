'use client';

import { useState } from 'react';
import { Settings, Server, Lock, Database, Bell, History } from 'lucide-react';
import { toast } from 'sonner';

import { PlatformSection } from '@/components/admin/settings/PlatformSection';
import { SecurityPolicySection } from '@/components/admin/settings/SecurityPolicySection';
import { InfrastructureSection } from '@/components/admin/settings/InfrastructureSection';
import { NotificationsSection } from '@/components/admin/settings/NotificationsSection';
import { AuditLogSection } from '@/components/admin/settings/AuditLogSection';

const systemMetrics = [
  { label: 'API Status', value: 'Operational' },
  { label: 'Database', value: 'Healthy' },
  { label: 'Avg Latency', value: '24ms' },
  { label: 'Uptime', value: '99.98%' },
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

const resourceMetrics = [
  { label: 'CPU Usage', value: 28, color: 'bg-cyan-500' },
  { label: 'Memory (RAM)', value: 61, color: 'bg-violet-500' },
  { label: 'Disk Storage', value: 44, color: 'bg-emerald-500' },
  { label: 'Network I/O', value: 15, color: 'bg-amber-500' },
];

const NAV_ITEMS = [
  { id: 'platform' as const, label: 'Global Platform', icon: Server, desc: 'Core config & branding' },
  { id: 'security' as const, label: 'Security Policy', icon: Lock, desc: '2FA, sessions, IP rules' },
  { id: 'infrastructure' as const, label: 'Infrastructure', icon: Database, desc: 'Backups & resources' },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell, desc: 'Alerts & webhooks' },
  { id: 'audit' as const, label: 'Audit Log', icon: History, desc: 'Admin activity history' },
];

type Section = (typeof NAV_ITEMS)[number]['id'];

export default function AdminSettingsPage() {
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
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1">
            <Settings className="size-3" /> System Administration
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Global configuration for Bilim Nuru</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 border border-emerald-200 shrink-0 mt-1">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-700">All Systems Operational</span>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6 items-start">
        {/* Left Sidebar */}
        <aside className="w-56 shrink-0 sticky top-6 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                    active ? 'bg-[#0B1437] shadow-md' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-white'
                  }`}>
                    <Icon className={`size-4 ${active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight truncate ${active ? 'text-white' : 'text-slate-700'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] leading-tight mt-0.5 truncate text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Status Panel */}
          <div className="bg-[#0B1437] rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Live Status</p>
            <div className="space-y-2.5">
              {systemMetrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{m.label}</span>
                  <span className="text-[11px] font-bold text-cyan-400 font-mono">{m.value}</span>
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
              systemMetrics={systemMetrics}
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
              resourceMetrics={resourceMetrics}
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

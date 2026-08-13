'use client';

import { Server, AlertTriangle, Zap } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SectionHeader, FormField, ToggleRow, SaveButton } from './SharedComponents';
import { Activity } from 'lucide-react';

interface PlatformSectionProps {
  platformName: string;
  setPlatformName: (v: string) => void;
  supportEmail: string;
  setSupportEmail: (v: string) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
  selfRegistration: boolean;
  setSelfRegistration: (v: boolean) => void;
  trialPeriod: string;
  setTrialPeriod: (v: string) => void;
  maxOrgs: string;
  setMaxOrgs: (v: string) => void;
  savingSection: string | null;
  handleSave: (section: string) => void;
  systemMetrics: { label: string; value: string }[];
}

export function PlatformSection({
  platformName, setPlatformName,
  supportEmail, setSupportEmail,
  maintenanceMode, setMaintenanceMode,
  selfRegistration, setSelfRegistration,
  trialPeriod, setTrialPeriod,
  maxOrgs, setMaxOrgs,
  savingSection, handleSave,
  systemMetrics
}: PlatformSectionProps) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<Server className="size-4" />} title={t('settings.nav_platform')} desc={t('settings.platform_header_desc')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/40">
            <CardTitle className="text-base font-semibold">{t('settings.core_config')}</CardTitle>
            <CardDescription>{t('settings.core_config_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('settings.platform_name')}>
                <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
              <FormField label={t('settings.support_email')}>
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
              <FormField label={t('settings.trial_period')}>
                <Input value={trialPeriod} onChange={(e) => setTrialPeriod(e.target.value)} type="number" min="1" className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
              <FormField label={t('settings.max_orgs')}>
                <Input value={maxOrgs} onChange={(e) => setMaxOrgs(e.target.value)} type="number" min="1" className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
            </div>
            <Separator />
            <div className="space-y-2">
              <ToggleRow
                title={t('settings.maintenance_mode')}
                desc={t('settings.maintenance_mode_desc')}
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
                danger
              />
              <ToggleRow
                title={t('settings.self_registration')}
                desc={t('settings.self_registration_desc')}
                checked={selfRegistration}
                onCheckedChange={setSelfRegistration}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/40 p-4 flex items-center justify-between gap-4">
            {maintenanceMode ? (
              <Alert className="rounded-xl border-warning/30 bg-warning-muted py-2 px-3 flex-1">
                <AlertTriangle className="size-3.5 text-warning-emphasis" />
                <AlertDescription className="text-warning-emphasis text-xs">{t('settings.maintenance_warning')}</AlertDescription>
              </Alert>
            ) : (
              <div />
            )}
            <SaveButton isSaving={savingSection === 'platform'} onClick={() => handleSave('platform')} label={t('settings.save_changes')} />
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Card className="relative overflow-hidden bg-primary text-primary-foreground">
            <CardHeader className="pb-3 relative">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-card flex items-center justify-center">
                  <Activity className="size-4 text-primary-emphasis" />
                </div>
                <CardTitle className="text-sm text-background">{t('settings.system_health')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 relative">
              {systemMetrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-bold text-primary-emphasis tabular-nums">{m.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {maintenanceMode ? (
            <Alert className="rounded-2xl border-warning/30 bg-warning-muted">
              <AlertTriangle className="size-4 text-warning-emphasis" />
              <AlertTitle className="text-warning-emphasis font-bold text-sm">{t('settings.maintenance_active')}</AlertTitle>
              <AlertDescription className="text-warning-emphasis text-xs">{t('settings.maintenance_active_desc')}</AlertDescription>
            </Alert>
          ) : (
            <Alert className="rounded-2xl border-success/30 bg-success-muted">
              <Zap className="size-4 text-success-emphasis" />
              <AlertTitle className="text-success-emphasis font-bold text-sm">{t('settings.platform_live')}</AlertTitle>
              <AlertDescription className="text-success-emphasis text-xs">{t('settings.platform_live_desc')}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

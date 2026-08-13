'use client';

import { Bell, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SectionHeader, FormField, ToggleRow, SaveButton } from './SharedComponents';

interface NotificationsSectionProps {
  emailAlerts: boolean;
  setEmailAlerts: (v: boolean) => void;
  newOrgAlerts: boolean;
  setNewOrgAlerts: (v: boolean) => void;
  systemAlerts: boolean;
  setSystemAlerts: (v: boolean) => void;
  weeklyReport: boolean;
  setWeeklyReport: (v: boolean) => void;
  webhookUrl: string;
  setWebhookUrl: (v: string) => void;
  savingSection: string | null;
  handleSave: (section: string) => void;
}

export function NotificationsSection({
  emailAlerts, setEmailAlerts,
  newOrgAlerts, setNewOrgAlerts,
  systemAlerts, setSystemAlerts,
  weeklyReport, setWeeklyReport,
  webhookUrl, setWebhookUrl,
  savingSection, handleSave
}: NotificationsSectionProps) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<Bell className="size-4" />} title={t('settings.nav_notifications')} desc={t('settings.notif_header_desc')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/40">
            <CardTitle className="text-base font-semibold">{t('settings.notif_prefs')}</CardTitle>
            <CardDescription>{t('settings.notif_prefs_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <ToggleRow
              title={t('settings.email_alerts')}
              desc={t('settings.email_alerts_desc')}
              checked={emailAlerts}
              onCheckedChange={setEmailAlerts}
              icon={<Mail className="size-4" />}
            />
            <Separator />
            <ToggleRow
              title={t('settings.new_org_alerts')}
              desc={t('settings.new_org_alerts_desc')}
              checked={newOrgAlerts}
              onCheckedChange={setNewOrgAlerts}
            />
            <ToggleRow
              title={t('settings.system_alerts')}
              desc={t('settings.system_alerts_desc')}
              checked={systemAlerts}
              onCheckedChange={setSystemAlerts}
            />
            <ToggleRow
              title={t('settings.weekly_report')}
              desc={t('settings.weekly_report_desc')}
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
            />
            <Separator />
            <FormField label={t('settings.webhook_url')}>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="rounded-xl bg-muted/50 border-border tabular-nums text-sm h-9"
              />
              <p className="text-caption text-muted-foreground mt-1">{t('settings.webhook_desc')}</p>
            </FormField>
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/40 p-4 flex justify-end">
            <SaveButton isSaving={savingSection === 'notifications'} onClick={() => handleSave('notifications')} label={t('settings.save_changes')} />
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t('settings.channel_summary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { ch: 'Email', active: emailAlerts },
              { ch: t('settings.ch_new_orgs'), active: newOrgAlerts },
              { ch: t('settings.system_alerts'), active: systemAlerts },
              { ch: t('settings.weekly_report'), active: weeklyReport },
              { ch: 'Webhook', active: !!webhookUrl },
            ].map((c) => (
              <div key={c.ch} className="flex items-center justify-between py-0.5">
                <span className="text-xs font-medium text-muted-foreground">{c.ch}</span>
                {c.active ? (
                  <Badge className="bg-success/15 text-success-emphasis border-success/25 rounded-lg text-caption gap-1 h-5">
                    <CheckCircle2 className="size-2.5" /> {t('active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-lg text-caption gap-1 text-muted-foreground h-5">
                    <XCircle className="size-2.5" /> {t('settings.off')}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

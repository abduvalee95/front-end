'use client';

import { Bell, Mail, CheckCircle2, XCircle } from 'lucide-react';
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
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<Bell className="size-4" />} title="Notifications" desc="Configure system-level alerts for Super Admin" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/40">
            <CardTitle className="text-base font-black">Notification Preferences</CardTitle>
            <CardDescription>Alerts sent directly to the Super Admin account.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <ToggleRow
              title="Email Alerts"
              desc="All system notifications delivered to your admin email."
              checked={emailAlerts}
              onCheckedChange={setEmailAlerts}
              icon={<Mail className="size-4" />}
            />
            <Separator />
            <ToggleRow
              title="New Organization Alerts"
              desc="Notified when a new org registers on the platform."
              checked={newOrgAlerts}
              onCheckedChange={setNewOrgAlerts}
            />
            <ToggleRow
              title="System Health Alerts"
              desc="Alerts for downtime, high latency, or resource spikes."
              checked={systemAlerts}
              onCheckedChange={setSystemAlerts}
            />
            <ToggleRow
              title="Weekly Digest Report"
              desc="Weekly summary of platform usage, growth, and revenue."
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
            />
            <Separator />
            <FormField label="Webhook URL (optional)">
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="rounded-xl bg-muted/50 border-border font-mono text-sm h-9"
              />
              <p className="text-[11px] text-muted-foreground mt-1">POST payload sent on every system event.</p>
            </FormField>
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/40 p-4 flex justify-end">
            <SaveButton isSaving={savingSection === 'notifications'} onClick={() => handleSave('notifications')} label="Save Notifications" />
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black">Channel Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { ch: 'Email', active: emailAlerts },
              { ch: 'New Orgs', active: newOrgAlerts },
              { ch: 'System Health', active: systemAlerts },
              { ch: 'Weekly Report', active: weeklyReport },
              { ch: 'Webhook', active: !!webhookUrl },
            ].map((c) => (
              <div key={c.ch} className="flex items-center justify-between py-0.5">
                <span className="text-xs font-medium text-muted-foreground">{c.ch}</span>
                {c.active ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 rounded-lg text-[10px] gap-1 h-5">
                    <CheckCircle2 className="size-2.5" /> Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-lg text-[10px] gap-1 text-muted-foreground h-5">
                    <XCircle className="size-2.5" /> Off
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

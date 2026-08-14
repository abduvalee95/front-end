'use client';

import { Lock, ShieldCheck, Globe, Clock, Key, History } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SectionHeader, FormField, ToggleRow, SaveButton, SecurityScoreCard } from './SharedComponents';

interface SecurityPolicySectionProps {
  mandatory2FA: boolean;
  setMandatory2FA: (v: boolean) => void;
  ipWhitelisting: boolean;
  setIpWhitelisting: (v: boolean) => void;
  sessionTimeout: string;
  setSessionTimeout: (v: string) => void;
  maxLoginAttempts: string;
  setMaxLoginAttempts: (v: string) => void;
  ipAllowlist: string;
  setIpAllowlist: (v: string) => void;
  savingSection: string | null;
  handleSave: (section: string) => void;
}

export function SecurityPolicySection({
  mandatory2FA, setMandatory2FA,
  ipWhitelisting, setIpWhitelisting,
  sessionTimeout, setSessionTimeout,
  maxLoginAttempts, setMaxLoginAttempts,
  ipAllowlist, setIpAllowlist,
  savingSection, handleSave
}: SecurityPolicySectionProps) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<Lock className="size-4" />} title={t('settings.nav_security')} desc={t('settings.security_header_desc')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/40">
            <CardTitle className="text-h3">{t('settings.global_policy')}</CardTitle>
            <CardDescription>{t('settings.global_policy_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <ToggleRow
              title={t('settings.mandatory_2fa')}
              desc={t('settings.mandatory_2fa_desc')}
              checked={mandatory2FA}
              onCheckedChange={setMandatory2FA}
              icon={<ShieldCheck className="size-4" />}
            />
            <Separator />
            <ToggleRow
              title={t('settings.ip_whitelisting')}
              desc={t('settings.ip_whitelisting_desc')}
              checked={ipWhitelisting}
              onCheckedChange={setIpWhitelisting}
              icon={<Globe className="size-4" />}
            />
            {ipWhitelisting && (
              <div className="space-y-1.5 pt-1 pl-1">
                <Label className="text-caption font-bold uppercase tracking-wider text-muted-foreground">{t('settings.allowed_ip')}</Label>
                <Textarea
                  value={ipAllowlist}
                  onChange={(e) => setIpAllowlist(e.target.value)}
                  placeholder={'192.168.1.0/24\n10.0.0.0/8'}
                  className="bg-muted/50 border-border rounded-xl tabular-nums text-body min-h-[90px]"
                />
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4 pt-1">
              <FormField label={<span className="flex items-center gap-1"><Clock className="size-3" /> {t('settings.session_timeout')}</span>}>
                <Input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} type="number" min="1" className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
              <FormField label={<span className="flex items-center gap-1"><Key className="size-3" /> {t('settings.max_login_attempts')}</span>}>
                <Input value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} type="number" min="1" className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/40 p-4 flex justify-between">
            <Button variant="outline" onClick={() => toast.info(t('settings.security_logs_soon'))} className="rounded-xl border-border gap-2 text-body">
              <History className="size-4" /> {t('settings.view_security_logs')}
            </Button>
            <SaveButton isSaving={savingSection === 'security'} onClick={() => handleSave('security')} label={t('settings.update_policy')} />
          </CardFooter>
        </Card>

        <SecurityScoreCard mandatory2FA={mandatory2FA} ipWhitelisting={ipWhitelisting} />
      </div>
    </div>
  );
}

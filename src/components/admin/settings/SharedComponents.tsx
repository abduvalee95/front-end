'use client';

import React from 'react';
import { useTranslations } from '@/i18n/index';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Save, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export function SectionHeader({ icon, title, desc }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-black text-foreground leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export interface FormFieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export interface ToggleRowProps {
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

export function ToggleRow({ title, desc, checked, onCheckedChange, icon, danger }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors">
      <div className="space-y-0.5 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          {icon && <span className={danger ? 'text-danger-emphasis' : 'text-muted-foreground'}>{icon}</span>}
          <Label className={`text-sm font-bold cursor-pointer ${danger ? 'text-danger-emphasis' : 'text-foreground'}`}>{title}</Label>
          {danger && checked && (
            <Badge className="bg-danger-muted text-danger-emphasis border-danger/30 rounded-md text-[10px] px-1.5 h-4">ACTIVE</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export interface SaveButtonProps {
  isSaving: boolean;
  onClick: () => void;
  label: string;
}

export function SaveButton({ isSaving, onClick, label }: SaveButtonProps) {
  const t = useTranslations('admin');
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 shadow-md gap-2 text-sm shrink-0"
    >
      {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
      {isSaving ? t('settings.saving') : label}
    </Button>
  );
}

export interface SecurityScoreCardProps {
  mandatory2FA: boolean;
  ipWhitelisting: boolean;
}

export function SecurityScoreCard({ mandatory2FA, ipWhitelisting }: SecurityScoreCardProps) {
  const t = useTranslations('admin');
  const checks = [
    { label: t('settings.mandatory_2fa'), ok: mandatory2FA },
    { label: t('settings.ip_whitelisting'), ok: ipWhitelisting },
    { label: 'JWT Auth', ok: true },
    { label: 'HTTPS Only', ok: true },
  ];
  const score = checks.filter((c) => c.ok).length;
  const pct = Math.round((score / checks.length) * 100);
  const color = pct >= 75 ? 'text-success-emphasis' : pct >= 50 ? 'text-warning-emphasis' : 'text-danger-emphasis';
  const barColor = pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger/100';

  return (
    <Card className="rounded-2xl border-border shadow-sm h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black">{t('settings.security_score')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`text-5xl font-black text-center tabular-nums ${color}`}>{pct}%</div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-2 pt-1">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-xs">
              {c.ok
                ? <CheckCircle2 className="size-3.5 text-success-emphasis shrink-0" />
                : <XCircle className="size-3.5 text-muted-foreground/50 shrink-0" />
              }
              <span className={c.ok ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}>{c.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

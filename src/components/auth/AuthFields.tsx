'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/i18n';

export function PasswordField({ value, onChange, disabled, newPassword = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; newPassword?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('auth_design');
  return (
    <div className="space-y-2">
      <label htmlFor="password" className="text-h4">{t('password')}</label>
      <div className="relative">
        <Input id="password" name="password" type={visible ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} autoComplete={newPassword ? 'new-password' : 'current-password'} required minLength={newPassword ? 12 : undefined} maxLength={128} disabled={disabled} className="h-12 pr-12 text-body" aria-describedby={newPassword ? 'password-help' : undefined} />
        <Button type="button" variant="ghost" size="icon" onClick={() => setVisible(v => !v)} disabled={disabled} aria-label={t(visible ? 'hide_password' : 'show_password')} aria-pressed={visible} className="absolute right-1 top-1.5">
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
      {newPassword && <p id="password-help" className="text-caption text-muted-foreground">{t('password_hint')}</p>}
    </div>
  );
}

export function GoogleButton({ onClick, disabled = false }: { onClick?: () => void; disabled?: boolean }) {
  const t = useTranslations('auth_design');
  return <Button type="button" variant="secondary" className="h-12 w-full text-h4" onClick={onClick} disabled={disabled}>
    <span aria-hidden="true" className="text-h2">G</span>{t('google')}
  </Button>;
}

export function AuthDivider() {
  const t = useTranslations('auth_design');
  return <div className="my-6 flex items-center gap-4 text-caption text-muted-foreground"><span className="h-px flex-1 bg-border" />{t('or')}<span className="h-px flex-1 bg-border" /></div>;
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  const t = useTranslations('auth_design');
  return <div className="mb-8"><p className="mb-3 text-caption uppercase tracking-widest text-primary-emphasis">{t('eyebrow')}</p><h1 className="text-h1" tabIndex={-1}>{title}</h1><p className="mt-3 text-body text-muted-foreground">{description}</p></div>;
}

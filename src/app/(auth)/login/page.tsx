'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthHeading, PasswordField } from '@/components/auth/AuthFields';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/i18n';

function LoginForm() {
  const t = useTranslations('auth_design');
  const params = useSearchParams();
  const { login, isLoading, loginError } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [validation, setValidation] = useState('');
  const [help, setHelp] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/[\s()-]/g, '');
    const normalized = /^\d{9}$/.test(digits) ? `+996${digits}` : /^996\d{9}$/.test(digits) ? `+${digits}` : digits;
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setValidation(t('invalid_phone'));
      return;
    }
    setValidation('');
    login({ phone: normalized, password, remember_me: remember });
  }

  return <AuthShell>
    <AuthHeading title={t('login_title')} description={t('live_description')} />
    {params.get('error') === 'session_expired' && <p role="status" className="mb-5 rounded-control bg-warning-muted p-3 text-body text-warning-emphasis">{t('expired')}</p>}
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="phone" className="text-h4">{t('phone')}</label>
        <Input id="phone" name="phone" type="tel" autoComplete="username" placeholder="+996 555 00 00 00" required value={phone} disabled={isLoading} onChange={e => { setPhone(e.target.value); setValidation(''); }} className="h-12 text-body" aria-invalid={Boolean(validation)} aria-describedby={validation ? 'phone-error' : undefined} />
        {validation && <p id="phone-error" role="alert" className="text-caption text-danger-emphasis">{validation}</p>}
      </div>
      <PasswordField value={password} onChange={setPassword} disabled={isLoading} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-body-sm text-muted-foreground"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={isLoading} className="size-4 accent-primary" />{t('remember')}</label>
        <Button type="button" variant="link" className="px-0 text-body-sm" aria-expanded={help} aria-controls="account-help" onClick={() => setHelp(!help)}>{t('forgot')}</Button>
      </div>
      {loginError && <p role="alert" className="rounded-control bg-danger-muted p-3 text-body text-danger-emphasis">{loginError}</p>}
      <Button type="submit" disabled={isLoading} className="h-12 w-full text-h4">{isLoading ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />{t('signing_in')}</> : <>{t('login')}<ArrowRight aria-hidden="true" /></>}</Button>
    </form>
    <div className="mt-7 border-t border-border pt-6 text-center">
      <p className="text-body text-muted-foreground">{t('no_account')} <Button type="button" variant="link" className="h-auto px-1 py-0" aria-expanded={help} aria-controls="account-help" onClick={() => setHelp(!help)}>{t('contact_admin')}</Button></p>
      {help && <p id="account-help" role="status" className="mt-4 rounded-control bg-muted p-4 text-left text-body text-muted-foreground">{t('admin_help')}</p>}
    </div>
    <p className="mt-8 flex items-center justify-center gap-2 text-caption text-muted-foreground"><ShieldCheck className="size-4" aria-hidden="true" />{t('secure_login')}</p>
  </AuthShell>;
}

export default function LoginPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="size-6 animate-spin" aria-label="Loading" /></div>}><LoginForm /></Suspense>;
}

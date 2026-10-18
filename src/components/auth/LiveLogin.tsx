'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell } from './AuthShell';
import { AuthDivider, AuthHeading, GoogleButton, PasswordField } from './AuthFields';
import { AuthLink, AuthMessage, errorTranslationKey, LiveField, normalizePhone, useBrowserLocationPart } from './LiveAuthShared';
import { authRequest } from '@/lib/auth/account-client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n';
import { pauseTenantRefresh, waitForPendingTenantRefresh } from '@/lib/auth/tenant-refresh';
import { silentRefreshManager } from '@/lib/auth/silent-refresh';

export function LiveLogin() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login, isLoading, loginError } = useAuth();
  const hash = useBrowserLocationPart('hash');
  const [chosenMethod, setMethod] = useState<'email' | 'phone' | null>(null);
  const method = chosenMethod ?? (hash === '#phone' ? 'phone' : 'email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [help, setHelp] = useState(false);
  const pending = busy || isLoading;

  async function accountDestination() {
    // The account cookie is not a dashboard session. Discard any previous tenant profile.
    useAuthStore.getState().clearAuth();
    queryClient.clear();
    if (params.get('next') === '/accept-invitation') {
      router.replace('/accept-invitation');
      return;
    }
    const invitation = await authRequest<{ pending: boolean }>('/api/auth/accounts/pending-invitation').catch(() => ({ pending: false }));
    router.replace(invitation.pending ? '/accept-invitation' : '/onboarding');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (method === 'phone') {
      const normalized = normalizePhone(phone);
      if (!/^\+[1-9]\d{7,14}$/.test(normalized)) { setError(t('invalid_phone')); setPhoneInvalid(true); return; }
      setPhoneInvalid(false);
      login({ phone: normalized, password, remember_me: remember });
      return;
    }
    setBusy(true);
    try {
      pauseTenantRefresh(); useAuthStore.getState().clearAuth(); silentRefreshManager.stop();
      await waitForPendingTenantRefresh();
      await authRequest('/api/auth/accounts/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
      setPassword('');
      await accountDestination();
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setError('');
    try {
      pauseTenantRefresh(); useAuthStore.getState().clearAuth(); silentRefreshManager.stop();
      await waitForPendingTenantRefresh();
      const data = await authRequest<{ authorizationUrl: string }>('/api/auth/accounts/google/start', { method: 'POST', body: '{}' });
      window.location.assign(data.authorizationUrl);
    } catch (failure) { setError(live(errorTranslationKey(failure))); setBusy(false); }
  }

  return <AuthShell>
    <AuthHeading title={t('login_title')} description={live(method === 'email' ? 'email_description' : 'phone_description')} />
    {params.get('error') === 'session_expired' && <p role="status" className="mb-5 rounded-control bg-warning-muted p-3 text-body text-warning-emphasis">{t('expired')}</p>}
    {params.has('auth_error') && <div className="mb-5"><AuthMessage error={live(params.get('auth_error') === 'identity_conflict' ? 'error_conflict' : 'google_error')} /></div>}
    <GoogleButton onClick={google} disabled={pending} /><AuthDivider />
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-control border border-border p-1" role="group" aria-label={t('choose_method')}>
        {(['email', 'phone'] as const).map(value => <Button key={value} type="button" variant={method === value ? 'primary' : 'ghost'} aria-pressed={method === value} disabled={pending} onClick={() => { setMethod(value); setError(''); setPhoneInvalid(false); setPassword(''); }}>{t(value)}</Button>)}
      </div>
      {method === 'email' ? <LiveField id="email" label={t('email')} type="email" value={email} onChange={setEmail} autoComplete="username" disabled={pending} /> : <LiveField id="phone" label={t('phone')} type="tel" value={phone} onChange={value => { setPhone(value); setPhoneInvalid(false); setError(''); }} autoComplete="username" placeholder="+996 555 00 00 00" maxLength={32} disabled={pending} invalid={phoneInvalid} describedBy={phoneInvalid ? 'phone-error' : undefined} />}
      {phoneInvalid && <p id="phone-error" role="alert" className="text-caption text-danger-emphasis">{t('invalid_phone')}</p>}
      <PasswordField value={password} onChange={setPassword} disabled={pending} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {method === 'phone' && <label className="flex items-center gap-2 text-body-sm text-muted-foreground"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} disabled={pending} className="size-4 accent-primary" />{t('remember')}</label>}
        {method === 'email' ? <AuthLink href="/forgot-password">{t('forgot')}</AuthLink> : <Button type="button" variant="link" className="px-0 text-body-sm" aria-expanded={help} aria-controls="account-help" onClick={() => setHelp(!help)}>{t('forgot')}</Button>}
      </div>
      {help && method === 'phone' && <p id="account-help" role="status" className="rounded-control bg-muted p-4 text-body text-muted-foreground">{t('admin_help')}</p>}
      <AuthMessage error={phoneInvalid ? undefined : error || (method === 'phone' ? loginError ?? '' : '')} />
      <Button type="submit" disabled={pending} className="h-12 w-full text-h4">{pending ? t('signing_in') : t('login')}<ArrowRight aria-hidden="true" /></Button>
    </form>
    <p className="mt-6 text-center text-body text-muted-foreground">{t('no_account')} <AuthLink href="/register">{t('register')}</AuthLink></p>
    <p className="mt-8 flex items-center justify-center gap-2 text-caption text-muted-foreground"><ShieldCheck className="size-4" aria-hidden="true" />{t('secure_login')}</p>
  </AuthShell>;
}

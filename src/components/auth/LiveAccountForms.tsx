'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AuthShell } from './AuthShell';
import { AuthDivider, AuthHeading, GoogleButton, PasswordField } from './AuthFields';
import { AuthLink, AuthLoading, AuthMessage, errorTranslationKey, LiveField, useEmailLinkToken } from './LiveAuthShared';
import { authRequest } from '@/lib/auth/account-client';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n';
import { pauseTenantRefresh, waitForPendingTenantRefresh } from '@/lib/auth/tenant-refresh';
import { silentRefreshManager } from '@/lib/auth/silent-refresh';

export function RegisterForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await authRequest('/api/auth/accounts/register', { method: 'POST', body: JSON.stringify({ full_name: name.trim(), email: email.trim(), password }) });
      setPassword(''); setDone(true);
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
    <AuthHeading title={t(done ? 'verify_title' : 'register_title')} description={live(done ? 'verify_description' : 'register_description')} />
    {done ? <div className="space-y-5"><AuthMessage notice={live('email_sent')} /><p className="text-body text-muted-foreground">{live('same_browser')}</p><Button variant="secondary" className="w-full" onClick={() => { setDone(false); setError(''); }}>{t('change_email')}</Button></div> : <>
      <GoogleButton onClick={google} disabled={busy} /><AuthDivider />
      <form onSubmit={submit} className="space-y-5">
        <LiveField id="full_name" label={t('full_name')} value={name} onChange={setName} autoComplete="name" minLength={2} maxLength={100} disabled={busy} />
        <LiveField id="email" label={t('email')} type="email" value={email} onChange={setEmail} autoComplete="email" disabled={busy} />
        <PasswordField value={password} onChange={setPassword} newPassword disabled={busy} />
        <AuthMessage error={error} /><Button type="submit" disabled={busy} className="h-12 w-full text-h4">{busy ? live('loading') : t('create_account')}</Button>
      </form>
    </>}
    <p className="mt-6 text-center text-body text-muted-foreground">{t('has_account')} <AuthLink href="/login">{t('login')}</AuthLink></p>
  </AuthShell>;
}

export function VerifyEmailForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const { token, ready, clearToken } = useEmailLinkToken();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function verify() {
    if (!token) return;
    setBusy(true); setError('');
    try {
      await authRequest('/api/auth/accounts/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
      clearToken(); setDone(true);
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }
  return <AuthShell><AuthHeading title={t('verify_title')} description={live('verify_description')} />
    <div className="space-y-5">{!ready ? <AuthLoading /> : done ? <AuthMessage notice={live('verified')} /> : <>
      {!token && <AuthMessage error={live('link_missing')} />}
      <AuthMessage error={error} />
      <Button type="button" className="h-12 w-full text-h4" disabled={busy || !token} onClick={verify}>{busy ? live('loading') : live('verify_action')}</Button>
      <AuthLink href="/register">{t('change_email')}</AuthLink>
    </>}
      <p><AuthLink href="/login">{t('back_login')}</AuthLink></p>
    </div>
  </AuthShell>;
}

export function ForgotPasswordForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await authRequest('/api/auth/accounts/forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      setDone(true);
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }
  return <AuthShell><AuthHeading title={t('forgot_title')} description={t('forgot_description')} />
    <form onSubmit={submit} className="space-y-5">
      {done ? <AuthMessage notice={live('email_sent')} /> : <><LiveField id="email" label={t('email')} type="email" value={email} onChange={setEmail} autoComplete="email" disabled={busy} /><AuthMessage error={error} /><Button type="submit" disabled={busy} className="h-12 w-full text-h4">{busy ? live('loading') : t('send_link')}</Button></>}
    </form><p className="mt-6"><AuthLink href="/login">{t('back_login')}</AuthLink></p>
  </AuthShell>;
}

export function ResetPasswordForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const queryClient = useQueryClient();
  const { token, ready, clearToken } = useEmailLinkToken();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!token) return;
    setBusy(true); setError('');
    try {
      pauseTenantRefresh(); useAuthStore.getState().clearAuth(); silentRefreshManager.stop();
      await waitForPendingTenantRefresh();
      await authRequest('/api/auth/accounts/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      clearToken(); setPassword(''); setDone(true);
      useAuthStore.getState().clearAuth(); queryClient.clear();
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }
  return <AuthShell><AuthHeading title={t('reset_title')} description={live('reset_description')} />
    {!ready ? <AuthLoading /> : done ? <AuthMessage notice={live('password_saved')} /> : <form onSubmit={submit} className="space-y-5">
      {!token && <AuthMessage error={live('link_missing')} />}
      <PasswordField value={password} onChange={setPassword} newPassword disabled={busy || !token} />
      <AuthMessage error={error} />
      <Button type="submit" disabled={busy || !token} className="h-12 w-full text-h4">{busy ? live('loading') : t('save_password')}</Button>
    </form>}
    <p className="mt-6"><AuthLink href={done ? '/login' : '/forgot-password'}>{done ? t('back_login') : t('send_link')}</AuthLink></p>
  </AuthShell>;
}

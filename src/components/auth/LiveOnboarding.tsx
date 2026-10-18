'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell } from './AuthShell';
import { AuthHeading, PasswordField } from './AuthFields';
import { AccountSessionView, AuthLink, AuthLoading, AuthMessage, errorTranslationKey, LiveField, normalizePhone, useBrowserLocationPart } from './LiveAuthShared';
import { AuthApiError, authRequest } from '@/lib/auth/account-client';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n';
import type { User } from '@/types/auth';
import { pauseTenantRefresh, resumeTenantRefresh, waitForPendingTenantRefresh } from '@/lib/auth/tenant-refresh';
import { silentRefreshManager } from '@/lib/auth/silent-refresh';

function useAccountSession() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AccountSessionView | null>(null);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    pauseTenantRefresh();
    silentRefreshManager.stop();
    useAuthStore.getState().clearAuth();
    queryClient.clear();
    authRequest<AccountSessionView>('/api/auth/accounts/me').then(data => {
      if (active) setSession(data);
    }).catch(failure => {
      if (!active) return;
      if (failure instanceof AuthApiError && failure.status === 401) router.replace('/login?error=session_expired');
      else setError(errorTranslationKey(failure));
    });
    return () => { active = false; };
  }, [queryClient, router]);
  return { session, error };
}

export function OnboardingForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const router = useRouter();
  const { session, error: sessionError } = useAccountSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const search = useBrowserLocationPart('search');
  const googleLinked = new URLSearchParams(search).get('google_linked') === '1';

  async function select(organization_id: string) {
    setBusy(true); setError('');
    try {
      await waitForPendingTenantRefresh();
      const data = await authRequest<{ user: User }>('/api/auth/accounts/select-organization', { method: 'POST', body: JSON.stringify({ organization_id }) });
      resumeTenantRefresh();
      useAuthStore.getState().setAuth({ ...data.user, is_active: data.user.is_active ?? true });
      router.replace(data.user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/dashboard');
      router.refresh();
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }

  async function linkGoogle() {
    setBusy(true); setError('');
    try {
      pauseTenantRefresh(); silentRefreshManager.stop();
      await waitForPendingTenantRefresh();
      const data = await authRequest<{ authorizationUrl: string }>('/api/auth/accounts/google/link', { method: 'POST', body: '{}' });
      window.location.assign(data.authorizationUrl);
    } catch (failure) { setError(live(errorTranslationKey(failure))); setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError('');
    try { await waitForPendingTenantRefresh(); await authRequest('/api/auth/logout', { method: 'POST', body: '{}' }); window.location.assign('/login'); }
    catch (failure) { setError(live(errorTranslationKey(failure))); setBusy(false); }
  }

  return <AuthShell><AuthHeading title={live('select_title')} description={live('select_description')} />
    {!session && !sessionError ? <AuthLoading /> : <div className="space-y-5">
      <AuthMessage error={sessionError ? live(sessionError) : error} notice={googleLinked ? live('google_linked') : undefined} />
      {session && <>
        <p className="break-words text-body-sm text-muted-foreground">{live('account_label')}: {session.account.email}</p>
        {session.memberships.length === 0 ? <p className="rounded-control bg-muted p-4 text-body text-muted-foreground">{live('no_centers')}</p> : <ul className="space-y-3">
          {session.memberships.map(membership => <li key={membership.organization_id} className="rounded-card border border-border p-4">
            <p className="flex items-center gap-2 text-h3"><Building2 className="size-5 shrink-0 text-primary" aria-hidden="true" />{membership.organization.name}</p>
            <Button type="button" className="mt-3 w-full" aria-label={`${live('select_center')}: ${membership.organization.name}`} disabled={busy || membership.organization.status !== 'ACTIVE'} onClick={() => select(membership.organization_id)}>{membership.organization.status === 'ACTIVE' ? live('select_center') : live('inactive_center')}<ArrowRight aria-hidden="true" /></Button>
          </li>)}
        </ul>}
        <div className="space-y-3 border-t border-border pt-5">
          <p><AuthLink href="/onboarding/create-center">{t('organization')}</AuthLink></p>
          <p><AuthLink href="/onboarding/link-membership">{live('link_title')}</AuthLink></p>
          <p><AuthLink href="/accept-invitation">{t('invitation')}</AuthLink></p>
        </div>
        <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={linkGoogle}>{live('google_link')}</Button>
        <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={logout}>{live('logout')}</Button>
      </>}
    </div>}
  </AuthShell>;
}

export function CreateCenterForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const router = useRouter();
  const { session, error: sessionError } = useAccountSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) { setError(t('invalid_phone')); return; }
    setBusy(true);
    try {
      await authRequest<{ organization_id: string }>('/api/auth/accounts/centers', { method: 'POST', body: JSON.stringify({ name: name.trim(), phone: normalized }) });
      setDone(true);
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }
  return <AuthShell><AuthHeading title={live('create_title')} description={live('create_description')} />
    {!session && !sessionError ? <AuthLoading /> : <>
      <AuthMessage error={sessionError ? live(sessionError) : undefined} />
      {done ? <div className="space-y-5"><AuthMessage notice={live('created')} /><Button className="h-12 w-full" onClick={() => router.replace('/onboarding')}>{live('select_title')}</Button></div> : session && <form onSubmit={submit} className="space-y-5">
        <LiveField id="organization_name" label={t('organization_name')} value={name} onChange={setName} minLength={2} maxLength={100} autoComplete="organization" disabled={busy} />
        <LiveField id="organization_phone" label={t('phone')} type="tel" value={phone} onChange={setPhone} maxLength={32} autoComplete="tel" placeholder="+996 555 00 00 00" disabled={busy} />
        <p className="text-body-sm text-muted-foreground">{live('invitation_phone')}</p>
        <AuthMessage error={error} /><Button type="submit" className="h-12 w-full text-h4" disabled={busy}>{busy ? live('loading') : live('create_action')}</Button>
      </form>}
      <p className="mt-6"><AuthLink href="/onboarding">{live('back')}</AuthLink></p>
    </>}
  </AuthShell>;
}

export function LinkMembershipForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const router = useRouter();
  const { session, error: sessionError } = useAccountSession();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) { setError(t('invalid_phone')); return; }
    setBusy(true);
    try {
      await authRequest('/api/auth/accounts/link-legacy', { method: 'POST', body: JSON.stringify({ phone: normalized, password }) });
      setPassword(''); setDone(true);
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }
  return <AuthShell><AuthHeading title={live('link_title')} description={live('link_description')} />
    {!session && !sessionError ? <AuthLoading /> : <>
      <AuthMessage error={sessionError ? live(sessionError) : undefined} />
      {done ? <div className="space-y-5"><AuthMessage notice={live('linked')} /><Button className="h-12 w-full" onClick={() => router.replace('/onboarding')}>{live('select_title')}</Button></div> : session && <form onSubmit={submit} className="space-y-5">
        <LiveField id="phone" label={t('phone')} type="tel" value={phone} onChange={setPhone} maxLength={32} autoComplete="username" placeholder="+996 555 00 00 00" disabled={busy} />
        <PasswordField value={password} onChange={setPassword} disabled={busy} />
        <AuthMessage error={error} /><Button type="submit" className="h-12 w-full text-h4" disabled={busy}>{busy ? live('loading') : live('link_action')}</Button>
      </form>}
      <p className="mt-6"><AuthLink href="/onboarding">{live('back')}</AuthLink></p>
    </>}
  </AuthShell>;
}

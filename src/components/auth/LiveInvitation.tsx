'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AuthShell } from './AuthShell';
import { AuthHeading } from './AuthFields';
import { AccountSessionView, AuthLink, AuthLoading, AuthMessage, errorTranslationKey, LiveField, normalizePhone, useEmailLinkToken } from './LiveAuthShared';
import { AuthApiError, authRequest } from '@/lib/auth/account-client';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n';

export function AcceptInvitationForm() {
  const t = useTranslations('auth_design');
  const live = useTranslations('auth_live');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, ready, clearToken } = useEmailLinkToken();
  const [session, setSession] = useState<AccountSessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvitation, setPendingInvitation] = useState(false);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let active = true;
    // Read-only checks never redeem the invitation; mail scanners cannot accept it.
    Promise.allSettled([
      authRequest<AccountSessionView>('/api/auth/accounts/me'),
      authRequest<{ pending: boolean }>('/api/auth/accounts/pending-invitation'),
    ]).then(([accountResult, pendingResult]) => {
      if (!active) return;
      if (accountResult.status === 'fulfilled') setSession(accountResult.value);
      else if (!(accountResult.reason instanceof AuthApiError && accountResult.reason.status === 401)) {
        setSessionError(errorTranslationKey(accountResult.reason));
      }
      if (pendingResult.status === 'fulfilled') setPendingInvitation(pendingResult.value.pending);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function signIn() {
    if (!token && !pendingInvitation) return;
    setBusy(true); setError('');
    try {
      if (token) {
        await authRequest('/api/auth/accounts/pending-invitation', { method: 'POST', body: JSON.stringify({ token }) });
        clearToken();
      }
      useAuthStore.getState().clearAuth(); queryClient.clear();
      router.push('/login?next=/accept-invitation');
    } catch (failure) { setError(live(errorTranslationKey(failure))); setBusy(false); }
  }

  async function accept(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) { setError(t('invalid_phone')); return; }
    setBusy(true);
    try {
      await authRequest('/api/auth/accounts/accept-invitation', { method: 'POST', body: JSON.stringify({ phone: normalized, ...(token ? { token } : {}) }) });
      clearToken(); setPendingInvitation(false); setDone(true);
    } catch (failure) { setError(live(errorTranslationKey(failure))); }
    finally { setBusy(false); }
  }

  const hasInvitation = Boolean(token || pendingInvitation);
  return <AuthShell><AuthHeading title={live('invitation_title')} description={live('invitation_description')} />
    {!ready || loading ? <AuthLoading /> : <div className="space-y-5">
      {done ? <><AuthMessage notice={live('invitation_accepted')} /><Button className="h-12 w-full" onClick={() => router.replace('/onboarding')}>{live('select_title')}</Button></> : <>
        {!hasInvitation && <p className="rounded-control bg-muted p-4 text-body text-muted-foreground">{live('invitation_missing')}</p>}
        {session ? <form onSubmit={accept} className="space-y-5">
          <p className="break-words text-body-sm text-muted-foreground">{live('account_label')}: {session.account.email}</p>
          <LiveField id="phone" label={t('phone')} value={phone} onChange={setPhone} type="tel" maxLength={32} autoComplete="tel" placeholder="+996 555 00 00 00" disabled={busy || !hasInvitation} describedBy="invitation-phone-help" />
          <p id="invitation-phone-help" className="text-body-sm text-muted-foreground">{live('invitation_phone')}</p>
          <AuthMessage error={error} /><Button type="submit" className="h-12 w-full text-h4" disabled={busy || !hasInvitation}>{busy ? live('loading') : live('invitation_accept')}</Button>
        </form> : <><AuthMessage error={error || (sessionError ? live(sessionError) : '')} /><Button type="button" className="h-12 w-full text-h4" disabled={busy || !hasInvitation} onClick={signIn}>{busy ? live('loading') : live('invitation_signin')}</Button></>}
      </>}
      <p><AuthLink href={session ? '/onboarding' : '/login'}>{live('back')}</AuthLink></p>
    </div>}
  </AuthShell>;
}

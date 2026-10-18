'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/i18n';
import { AuthApiError } from '@/lib/auth/account-client';

export interface AccountView {
  id: string; email: string; full_name: string; email_verified: boolean;
}
export interface AccountSessionView {
  account: AccountView;
  memberships: Array<{ organization_id: string; role: string; organization: { name: string; status: string } }>;
  onboardingRequired: boolean;
}

export function errorTranslationKey(error: unknown): string {
  if (!(error instanceof AuthApiError)) return 'error_network';
  if (error.code === 'BINDING_REQUIRED') return 'same_browser';
  if (error.code === 'CSRF_INVALID') return 'error_generic';
  if (error.code === 'CSRF_UNAVAILABLE') return 'error_unavailable';
  return ({ 400: 'error_invalid', 401: 'error_auth', 403: 'error_forbidden', 404: 'error_disabled',
    409: 'error_conflict', 429: 'error_rate', 502: 'error_unavailable', 503: 'error_unavailable',
    504: 'error_unavailable' } as Record<number, string>)[error.status] ?? 'error_generic';
}

export function AuthMessage({ error, notice }: { error?: string; notice?: string }) {
  return <>{error && <p role="alert" className="rounded-control bg-danger-muted p-3 text-body text-danger-emphasis">{error}</p>}
    {notice && <p role="status" className="rounded-control bg-success-muted p-3 text-body text-success-emphasis">{notice}</p>}</>;
}

export function AuthLoading() {
  const t = useTranslations('auth_live');
  return <p role="status" className="flex items-center gap-2 text-body text-muted-foreground"><Loader2 className="size-5 animate-spin" aria-hidden="true" />{t('loading')}</p>;
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-control text-body text-primary-emphasis underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{children}</Link>;
}

export function LiveField({ id, label, value, onChange, type = 'text', disabled, autoComplete, minLength, maxLength = 254, placeholder, describedBy, invalid }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  type?: string; disabled?: boolean; autoComplete?: string; minLength?: number; maxLength?: number; placeholder?: string; describedBy?: string; invalid?: boolean;
}) {
  return <div className="space-y-2"><label htmlFor={id} className="text-h4">{label}</label><Input id={id} name={id} type={type} required value={value} onChange={event => onChange(event.target.value)} disabled={disabled} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} placeholder={placeholder} aria-describedby={describedBy} aria-invalid={invalid} className="h-12 text-body" /></div>;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s()-]/g, '');
  return /^\d{9}$/.test(digits) ? `+996${digits}` : /^996\d{9}$/.test(digits) ? `+${digits}` : digits;
}

function subscribeLocation(listener: () => void) {
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  return () => {
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
  };
}

export function useBrowserLocationPart(part: 'hash' | 'search') {
  return useSyncExternalStore(subscribeLocation, () => window.location[part], () => '');
}

/** Email bearer links are removed before any network request and consumed only by a button. */
export function useEmailLinkToken() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const fragment = window.location.hash;
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    const candidate = new URLSearchParams(fragment.slice(1)).get('token');
    setToken(candidate && /^[A-Za-z0-9_-]{43}$/.test(candidate) ? candidate : null);
    setReady(true);
  }, []);
  return { token, ready, clearToken: () => setToken(null) };
}

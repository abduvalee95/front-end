'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, MailPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale, useTranslations } from '@/i18n/index';
import { AuthApiError, authRequest } from '@/lib/auth/account-client';
import { useAuthStore } from '@/store/auth.store';

type InvitationRole = 'TEACHER' | 'MANAGER' | 'STUDENT';

interface InvitationResult {
  invitation_id: string;
  expires_at: string;
}

function errorKey(error: unknown): string {
  if (!(error instanceof AuthApiError)) return 'error_generic';
  switch (error.status) {
    case 401: return 'error_session';
    case 403: return 'error_forbidden';
    case 409: return 'error_conflict';
    case 429: return 'error_rate_limit';
    case 404:
    case 503: return 'error_unavailable';
    default: return 'error_generic';
  }
}

export default function InvitationsPage() {
  const t = useTranslations('invitations');
  const tUsers = useTranslations('users');
  const tSettings = useTranslations('settings');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const currentRole = useAuthStore(state => state.user?.role);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitationRole>('TEACHER');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ email: string; expiresAt: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || currentRole !== 'ADMIN') return;
    setPending(true);
    setError(null);
    setSent(null);
    const recipient = email.trim();
    try {
      const result = await authRequest<InvitationResult>('/api/auth/accounts/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: recipient, role }),
      });
      setSent({ email: recipient, expiresAt: result.expires_at });
      setEmail('');
    } catch (cause) {
      setError(errorKey(cause));
    } finally {
      setPending(false);
    }
  }

  const expiresAt = sent ? new Date(sent.expiresAt) : null;
  const expiryLabel = expiresAt && Number.isFinite(expiresAt.getTime())
    ? new Intl.DateTimeFormat(locale === 'kg' ? 'ky-KG' : locale, {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(expiresAt)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('description')} icon={MailPlus} />

      {currentRole !== 'ADMIN' ? (
        <Alert variant="destructive"><AlertDescription>{t('admin_only')}</AlertDescription></Alert>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('form_title')}</CardTitle>
            <CardDescription>{t('form_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5" aria-busy={pending}>
              {error && (
                <Alert variant="destructive"><AlertDescription>{t(error)}</AlertDescription></Alert>
              )}
              {sent && (
                <div role="status" className="flex items-start gap-3 rounded-control border border-success/20 bg-success/10 p-4 text-success-emphasis">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div className="space-y-1">
                    <p className="text-body-sm">{t('sent', { email: sent.email })}</p>
                    {expiryLabel && <p className="text-caption">{t('expires', { date: expiryLabel })}</p>}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="invitation-email">{tSettings('email')}</Label>
                <Input id="invitation-email" name="email" type="email" autoComplete="email"
                  value={email} onChange={event => setEmail(event.target.value)}
                  maxLength={254} required disabled={pending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitation-role">{tCommon('role')}</Label>
                <Select value={role} disabled={pending} onValueChange={value => {
                  if (value === 'TEACHER' || value === 'MANAGER' || value === 'STUDENT') setRole(value);
                }}>
                  <SelectTrigger id="invitation-role" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEACHER">{tUsers('role_teacher')}</SelectItem>
                    <SelectItem value="MANAGER">{tUsers('role_manager')}</SelectItem>
                    <SelectItem value="STUDENT">{tUsers('role_student')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MailPlus className="size-4" aria-hidden />}
                {t(pending ? 'submitting' : 'submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

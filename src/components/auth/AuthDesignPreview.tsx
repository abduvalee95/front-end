'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Mail, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from './AuthShell';
import { AuthDivider, AuthHeading, GoogleButton, PasswordField } from './AuthFields';
import { useTranslations } from '@/i18n';

type Step = 'login' | 'register' | 'verify' | 'onboarding' | 'organization' | 'invitation' | 'forgot' | 'reset' | 'complete';

// Deliberately a visual sandbox: no fetch, cookies, storage or session updates.
// It must never be reused as a live authentication controller.
export function AuthDesignPreview() {
  const t = useTranslations('auth_design');
  const [step, setStep] = useState<Step>('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [choice, setChoice] = useState<'organization' | 'invitation'>('organization');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const content = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    content.current?.querySelector('h1')?.focus();
  }, [step]);

  function go(next: Step) { setPassword(''); setNotice(''); setStep(next); }
  function submit(event: React.FormEvent, next: Step) { event.preventDefault(); go(next); }
  const social = <><GoogleButton onClick={() => { go('onboarding'); }} /><AuthDivider /></>;
  const field = (id: string, label: string, type = 'text', placeholder = '', required = true) => <div className="space-y-2"><label htmlFor={id} className="text-h4">{label}</label><Input id={id} name={id} type={type} required={required} placeholder={placeholder} autoComplete="off" className="h-12 text-body" /></div>;
  const next = (label: string) => <Button type="submit" className="h-12 w-full text-h4">{label}<ArrowRight aria-hidden="true" /></Button>;

  return <AuthShell>
    <div className="mb-7 rounded-control border border-warning/30 bg-warning-muted p-3 text-warning-emphasis">
      <p className="text-h4">{t('preview_title')}</p>
      <p className="mt-1 text-caption">{t('preview_notice')}</p>
    </div>
    <nav aria-label={t('preview_nav')} className="mb-7 flex flex-wrap gap-2">
      {(['login', 'register', 'onboarding'] as const).map(tab => <Button key={tab} type="button" size="sm" variant={step === tab ? 'primary' : 'secondary'} aria-current={step === tab ? 'step' : undefined} onClick={() => go(tab)}>{t(tab)}</Button>)}
    </nav>
    <div ref={content} key={step}>
      {(step === 'login' || step === 'register') && <>
        <AuthHeading title={t(step === 'login' ? 'login_title' : 'register_title')} description={t('choose_method')} />
        {social}
        <form onSubmit={e => submit(e, step === 'register' ? 'verify' : 'onboarding')} className="space-y-5">
          {step === 'register' ? field('full_name', t('full_name'), 'text', t('name_placeholder')) : <div className="grid grid-cols-2 gap-1 rounded-control border border-border p-1" role="group" aria-label={t('choose_method')}>
            {(['email', 'phone'] as const).map(value => <Button key={value} type="button" variant={method === value ? 'primary' : 'ghost'} aria-pressed={method === value} onClick={() => setMethod(value)}>{t(value)}</Button>)}
          </div>}
          {step === 'register' || method === 'email' ? field('email', t('email'), 'email', 'name@example.com') : field('phone', t('phone'), 'tel', '+996 555 00 00 00')}
          <PasswordField value={password} onChange={setPassword} newPassword={step === 'register'} />
          {step === 'login' && <div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-body-sm text-muted-foreground"><input type="checkbox" className="size-4 accent-primary" />{t('remember')}</label><Button type="button" variant="link" className="px-0" onClick={() => go('forgot')}>{t('forgot')}</Button></div>}
          {next(t(step === 'login' ? 'login' : 'create_account'))}
        </form>
        <p className="mt-6 text-center text-body text-muted-foreground">{t(step === 'login' ? 'no_account' : 'has_account')} <Button type="button" variant="link" className="px-1" onClick={() => go(step === 'login' ? 'register' : 'login')}>{t(step === 'login' ? 'register' : 'login')}</Button></p>
      </>}
      {step === 'verify' && <>
        <Mail className="mb-6 size-10 text-primary" aria-hidden="true" />
        <AuthHeading title={t('verify_title')} description={t('verify_description')} />
        <Button className="h-12 w-full" onClick={() => go('onboarding')}>{t('preview_verified')}<ArrowRight aria-hidden="true" /></Button>
        <Button variant="link" className="mt-3 w-full" onClick={() => setNotice(t('preview_no_email'))}>{t('resend')}</Button>
        <Button variant="ghost" className="w-full" onClick={() => go('register')}>{t('change_email')}</Button>
      </>}
      {step === 'onboarding' && <>
        <p className="mb-5 text-caption text-muted-foreground">{t('step_one')}</p>
        <AuthHeading title={t('onboarding_title')} description={t('onboarding_description')} />
        <form onSubmit={e => submit(e, choice)} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="sr-only">{t('onboarding_description')}</legend>
            {(['organization', 'invitation'] as const).map(value => <label key={value} className={`flex cursor-pointer items-center gap-4 rounded-card border p-5 transition-colors focus-within:ring-2 focus-within:ring-ring ${choice === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
              {value === 'organization' ? <Building2 className="size-6 shrink-0 text-primary" aria-hidden="true" /> : <Ticket className="size-6 shrink-0 text-primary" aria-hidden="true" />}
              <span className="flex-1"><span className="block text-h4">{t(value)}</span><span className="mt-1 block text-body-sm text-muted-foreground">{t(`${value}_description`)}</span></span>
              <input type="radio" name="onboarding" value={value} checked={choice === value} onChange={() => setChoice(value)} className="size-4 accent-primary" />
            </label>)}
          </fieldset>
          {next(t('continue'))}
        </form>
      </>}
      {(step === 'organization' || step === 'invitation') && <>
        <Button variant="ghost" className="mb-5 pl-0" onClick={() => go('onboarding')}><ArrowLeft aria-hidden="true" />{t('back')}</Button>
        <p className="mb-5 text-caption text-muted-foreground">{t('step_two')}</p>
        <AuthHeading title={t(step)} description={t(`${step}_description`)} />
        <form onSubmit={e => submit(e, 'complete')} className="space-y-5">
          {step === 'organization' ? <>{field('organization_name', t('organization_name'), 'text', 'Bilim Nuru')}{field('organization_phone', t('phone'), 'tel', '+996 555 00 00 00')}<p className="rounded-control bg-muted p-3 text-body-sm text-muted-foreground">{t('organization_role')}</p></> : <>{field('invitation_code', t('invitation_code'), 'text', 'BN-…')}<p className="rounded-control bg-muted p-3 text-body-sm text-muted-foreground">{t('invitation_role')}</p></>}
          {next(t('continue'))}
        </form>
      </>}
      {step === 'forgot' && <>
        <AuthHeading title={t('forgot_title')} description={t('forgot_description')} />
        <form onSubmit={e => { e.preventDefault(); setNotice(t('preview_no_email')); }} className="space-y-5">
          {field('recovery_email', t('email'), 'email', 'name@example.com')}{next(t('send_link'))}
        </form>
        <Button variant="link" className="mt-5 w-full" onClick={() => go('reset')}>{t('preview_reset')}</Button>
        <Button variant="ghost" className="w-full" onClick={() => go('login')}>{t('back_login')}</Button>
      </>}
      {step === 'reset' && <>
        <AuthHeading title={t('reset_title')} description={t('password_hint')} />
        <form onSubmit={e => submit(e, 'complete')} className="space-y-5"><PasswordField value={password} onChange={setPassword} newPassword />{next(t('save_password'))}</form>
      </>}
      {step === 'complete' && <>
        <CheckCircle2 className="mb-6 size-12 text-primary" aria-hidden="true" />
        <AuthHeading title={t('complete_title')} description={t('complete_description')} />
        <Button onClick={() => go('login')} className="h-12 w-full">{t('restart')}</Button>
      </>}
      {notice && <p role="status" className="mt-5 rounded-control bg-muted p-4 text-body text-muted-foreground">{notice}</p>}
    </div>
  </AuthShell>;
}

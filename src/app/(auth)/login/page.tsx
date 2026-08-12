/**
 * Login Page
 * Enterprise SaaS Grade Authentication UI
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Phone,
  School,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/i18n/index';

function LoginForm() {
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'session_expired') {
      toast.error(t('session_expired'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error(t('enter_phone_error'));
      return;
    }
    if (!password) {
      toast.error(t('enter_password_error'));
      return;
    }

    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('996') && formattedPhone.length === 12) {
        // User typed 996901234567 -> +996901234567
        formattedPhone = '+' + formattedPhone;
      } else if (formattedPhone.length === 9) {
        // User typed 901234567 -> +996901234567
        formattedPhone = '+996' + formattedPhone;
      } else {
        // Fallback: assume Kyrgyzstan
        formattedPhone = '+996' + formattedPhone;
      }
    }

    login({ phone: formattedPhone, password, remember_me: rememberMe });
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10" suppressHydrationWarning>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.86),rgba(255,255,255,0.54)_42%,rgba(3,203,231,0.10)_42.2%,rgba(3,203,231,0.10)_100%)] dark:bg-[linear-gradient(115deg,rgba(8,13,30,0.96),rgba(8,13,30,0.78)_42%,rgba(3,203,231,0.10)_42.2%,rgba(3,203,231,0.10)_100%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-sm backdrop-blur dark:bg-white/5">
              <ShieldCheck className="size-4" />
              Organization access
            </div>
            <h1 className="max-w-[12ch] text-6xl font-black leading-[0.92] tracking-tight text-foreground">
              Learning operations, tightened.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
              A quiet control room for Билим Нуру teams to monitor students, teachers,
              CRM activity, and revenue without losing the thread of the school day.
            </p>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-3">
            {[
              { label: 'All Users', value: '2,500+', icon: UsersRound },
              { label: 'Courses', value: '45+', icon: School },
              { label: 'Organizations', value: '12', icon: Building2 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/70 bg-white/68 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5"
              >
                <item.icon className="mb-5 size-5 text-primary" />
                <div className="text-2xl font-black tabular-nums text-foreground">{item.value}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[28rem]">
          <div className="flex flex-col items-center">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white/10 shadow-[0_24px_60px_rgba(14,110,234,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 transition-transform hover:scale-105 duration-500">
              <Image
                src="/logo.svg"
                alt="Bilim Nuru"
                width={70}
                height={70}
                className="h-full w-full object-contain p-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<span class="text-3xl font-black">BN</span>';
                }}
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/80 bg-card/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-card/78">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">{t('welcome_back_title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('sign_in_subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  {t('phone_number')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+996 505 00 44 11"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? t('hide_password') : t('show_password')}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground">{t('remember_me')}</span>
                </label>
                <a href="#" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                  {t('forgot_password')}
                </a>
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-card text-white shadow-[0_16px_35px_rgba(15,23,42,0.22)] hover:bg-card dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    {t('signing_in')}
                  </>
                ) : (
                  t('sign_in_button')
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-primary/12 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
              {t('phone_info')}
            </div>
          </div>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            {t('no_account')}{' '}
            <a href="#" className="font-semibold text-primary transition-colors hover:text-primary/80">
              {t('contact_admin')}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

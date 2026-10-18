'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ChartNoAxesCombined, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from '@/i18n';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth_design');
  return (
    <div className="auth-surface min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-control focus-visible:outline-2 focus-visible:outline-ring" aria-label="Bilim Nuru">
          <Image src="/logo.svg" width={40} height={40} alt="" priority className="size-10 object-contain" />
          <span className="text-h2">Bilim Nuru<span className="mt-0.5 block text-caption text-muted-foreground">CRM + LMS</span></span>
        </Link>
        <LanguageSwitcher variant="auth" />
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-8">
        <div className="grid min-h-[720px] overflow-hidden rounded-card border border-border bg-card shadow-card-hover lg:grid-cols-2">
          <aside className="relative hidden overflow-hidden bg-auth-panel px-12 py-16 text-auth-panel-foreground lg:flex lg:flex-col lg:justify-between">
            <div className="relative z-10 inline-flex items-center gap-2 text-caption uppercase tracking-widest text-auth-panel-muted"><span className="size-2 rounded-full bg-auth-accent" />{t('workspace')}</div>
            <div className="relative z-10 py-16">
              <h2 className="max-w-md text-display leading-tight">{t('hero_title')}</h2>
              <p className="mt-6 max-w-sm text-h3 leading-relaxed text-auth-panel-muted">{t('hero_description')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[[UsersRound, 'CRM'], [GraduationCap, 'LMS'], [ChartNoAxesCombined, t('finance')]].map(([Icon, label]) => {
                  const FeatureIcon = Icon as typeof UsersRound;
                  return <span key={String(label)} className="inline-flex items-center gap-2 rounded-control border border-auth-panel-muted/20 bg-auth-panel-foreground/5 px-4 py-3 text-h4"><FeatureIcon className="size-4 text-auth-accent" aria-hidden="true" />{String(label)}</span>;
                })}
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-body-sm text-auth-panel-muted"><ShieldCheck className="size-4" aria-hidden="true" />{t('hero_footer')}</div>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 size-[520px] rounded-full border-[64px] border-auth-accent/10" />
            <BookOpen aria-hidden="true" strokeWidth={0.6} className="pointer-events-none absolute -bottom-20 -left-8 size-80 -rotate-12 text-auth-accent/15" />
          </aside>
          <section className="flex min-w-0 items-center justify-center px-6 py-10 sm:px-12 sm:py-14">
            <div className="w-full max-w-md">{children}</div>
          </section>
        </div>
        <footer className="pt-6 text-center text-caption text-muted-foreground">{t('footer')}</footer>
      </main>
    </div>
  );
}

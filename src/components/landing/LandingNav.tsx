'use client';

import Link from 'next/link';
import { useTranslations } from '@/i18n/index';
import { ArrowIcon } from './shared';

export function LandingNav() {
  const t = useTranslations('landing');

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-slate-200/70" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-[68px] flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="size-9 rounded-xl brand-grad flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 4.9L19 9.7l-3.8 3.4 1 5.2L12 16l-4.2 2.3 1-5.2L5 9.7l5.1-1.8z" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-black tracking-tight text-slate-900">Bilim Nuru</p>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-slate-400 -mt-0.5">Education OS</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-[13.5px] font-semibold text-slate-600">
          <a href="#features" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">{t('nav_features')}</a>
          <a href="#journal" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">{t('nav_journal')}</a>
          <a href="#analytics" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">{t('nav_analytics')}</a>
          <a href="#pricing" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">{t('nav_pricing')}</a>
          <a href="#faq" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">{t('nav_faq')}</a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex text-[13px] font-bold text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50">
            {t('nav_login')}
          </Link>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white px-4 py-2 rounded-xl brand-grad hover:opacity-95 transition" style={{ boxShadow: '0 10px 22px -10px rgba(14,110,234,0.55)' }}>
            {t('nav_start_free')}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}

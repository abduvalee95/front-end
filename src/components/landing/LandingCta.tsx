'use client';

import Link from 'next/link';
import { useTranslations } from '@/i18n/index';
import { ArrowIcon } from './shared';

export function LandingCta() {
  const t = useTranslations('landing');

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: '#0B1437' }}>
      <div className="absolute inset-0 landing-dot-grid opacity-10"></div>
      <div className="absolute -bottom-40 -left-20 size-[420px] rounded-full brand-grad opacity-30 blur-3xl"></div>
      <div className="absolute -top-20 right-0 size-[360px] rounded-full opacity-25 blur-3xl" style={{ background: '#00EC81' }}></div>

      <div className="relative max-w-[900px] mx-auto px-6 lg:px-8 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: '#03CBE7' }}>{t('cta_eyebrow')}</p>
        <h2 className="mt-4 text-[40px] lg:text-[56px] leading-[1.05] font-black tracking-tight text-white">
          {t('cta_title_1')} <span className="brand-grad-text">{t('cta_title_hl')}</span><br />
          {t('cta_title_2')}
        </h2>
        <p className="mt-6 text-[16px] text-slate-300 max-w-[560px] mx-auto leading-relaxed">
          {t('cta_desc')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl brand-grad text-white text-[14.5px] font-bold" style={{ boxShadow: '0 16px 36px -12px rgba(3,203,231,0.55)' }}>
            {t('cta_primary')}
            <ArrowIcon />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-white text-[14.5px] font-bold border border-white/15 hover:bg-white/15" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
            {t('cta_secondary')}
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-[12px] font-bold text-slate-400">
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400"></span>{t('cta_badge1')}</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400"></span>{t('cta_badge2')}</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400"></span>{t('cta_badge3')}</span>
        </div>
      </div>
    </section>
  );
}

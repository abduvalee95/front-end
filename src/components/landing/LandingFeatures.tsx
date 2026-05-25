'use client';

import { useTranslations } from '@/i18n/index';
import { CheckIcon } from './shared';

export function LandingFeatures() {
  const t = useTranslations('landing');

  return (
    <section id="features" className="relative py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div className="max-w-[640px]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] brand-grad-text">{t('features_eyebrow')}</p>
            <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight text-slate-900">
              {t('features_title')}
            </h2>
          </div>
          <p className="lg:max-w-[380px] text-[15px] text-slate-600 leading-relaxed">
            {t('features_desc')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1 — Journal */}
          <article className="group relative rounded-3xl bg-white border border-slate-200 p-7 ring-soft hover:-translate-y-0.5 transition">
            <div className="size-12 rounded-2xl flex items-center justify-center brand-grad text-white">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h16a2 2 0 012 2v14" /><path d="M2 4v15a1 1 0 001 1h17" /><path d="M7 9h7M7 13h5" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900">{t('feat1_title')}</h3>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
              {t('feat1_desc')}
            </p>
            <ul className="mt-5 space-y-2 text-[12.5px] font-semibold text-slate-600">
              {[t('feat1_check1'), t('feat1_check2'), t('feat1_check3')].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="size-4 rounded-md landing-check flex items-center justify-center shrink-0 mt-0.5"><CheckIcon /></span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* 2 — Analytics (dark) */}
          <article className="group relative rounded-3xl border border-slate-200 p-7 ring-soft hover:-translate-y-0.5 transition" style={{ background: 'linear-gradient(180deg,#0f172a,#1e293b)', color: '#e2e8f0' }}>
            <div className="size-12 rounded-2xl flex items-center justify-center text-slate-900" style={{ background: 'linear-gradient(135deg,#00EC81,#03CBE7)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-white">{t('feat2_title')}</h3>
            <p className="mt-2 text-[14px] text-slate-300 leading-relaxed">
              {t('feat2_desc')}
            </p>
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-end gap-1.5 h-[64px]">
                {[35, 55, 42, 78, 62, 88, 74, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t brand-grad" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                {['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sh', 'Ya', 'Du'].map((d, i) => <span key={i}>{d}</span>)}
              </div>
            </div>
          </article>

          {/* 3 — Schedule */}
          <article className="group relative rounded-3xl bg-white border border-slate-200 p-7 ring-soft hover:-translate-y-0.5 transition">
            <div className="size-12 rounded-2xl flex items-center justify-center text-blue-700" style={{ background: 'linear-gradient(135deg,#DBEAFE,#CFFAFE)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900">{t('feat3_title')}</h3>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
              {t('feat3_desc')}
            </p>
            <div className="mt-5 grid grid-cols-5 gap-1 text-[10px] font-mono">
              {[{ label: 'Du', active: false }, { label: '9:00', active: true }, { label: 'Cho', active: false }, { label: '9:00', active: true }, { label: 'Ju', active: false }].map((c, i) => (
                <div key={i} className={`aspect-square rounded flex items-center justify-center font-bold ${c.active ? 'brand-grad text-white' : 'bg-slate-100 text-slate-400'}`}>{c.label}</div>
              ))}
            </div>
          </article>

          {/* 4 — Finance */}
          <article className="group relative rounded-3xl bg-white border border-slate-200 p-7 ring-soft hover:-translate-y-0.5 transition">
            <div className="size-12 rounded-2xl flex items-center justify-center text-emerald-700" style={{ background: 'linear-gradient(135deg,#DCFCE7,#A7F3D0)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 14h4" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900">{t('feat4_title')}</h3>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
              {t('feat4_desc')}
            </p>
            <div className="mt-5 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('feat4_revenue_label')}</p>
                <p className="text-[18px] font-black text-slate-900 mt-0.5 tabular-nums">{t('feat4_revenue_value')} <span className="text-[11px] font-bold text-slate-500">{t('feat4_currency')}</span></p>
              </div>
              <span className="px-2 py-1 rounded-md text-[10.5px] font-black text-emerald-700 bg-emerald-100">+12%</span>
            </div>
          </article>

          {/* 5 — Leads */}
          <article className="group relative rounded-3xl bg-white border border-slate-200 p-7 ring-soft hover:-translate-y-0.5 transition">
            <div className="size-12 rounded-2xl flex items-center justify-center text-amber-700" style={{ background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2" /><path d="M7 8H5a2 2 0 00-2 2v8a2 2 0 002 2h2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900">{t('feat5_title')}</h3>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
              {t('feat5_desc')}
            </p>
            <div className="mt-5 flex gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-cyan-400"></div>
              <div className="flex-1 h-1.5 rounded-full bg-blue-500"></div>
              <div className="flex-1 h-1.5 rounded-full bg-emerald-500"></div>
              <div className="flex-1 h-1.5 rounded-full bg-slate-200"></div>
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500">
              <span>{t('feat5_stage1')}</span><span>{t('feat5_stage2')}</span><span>{t('feat5_stage3')}</span><span>—</span>
            </div>
          </article>

          {/* 6 — Parent */}
          <article className="group relative rounded-3xl bg-white border border-slate-200 p-7 ring-soft hover:-translate-y-0.5 transition">
            <div className="size-12 rounded-2xl flex items-center justify-center text-fuchsia-700" style={{ background: 'linear-gradient(135deg,#FCE7F3,#FBCFE8)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4z" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900">{t('feat6_title')}</h3>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
              {t('feat6_desc')}
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
              <p className="text-[10.5px] font-mono text-slate-500">SMS · 17:42</p>
              {/* dangerouslySetInnerHTML preserved from original — content is a static translation string, not user input */}
              <p className="text-[12.5px] font-semibold text-slate-700 leading-snug mt-1" dangerouslySetInnerHTML={{ __html: t('mockup_sms') }}></p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

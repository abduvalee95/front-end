'use client';

import { useTranslations } from '@/i18n/index';

export function LandingAnalytics() {
  const t = useTranslations('landing');

  return (
    <section id="analytics" className="relative py-24 bg-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Chart mockup */}
        <div className="order-2 lg:order-1 relative">
          <div className="rounded-3xl bg-white ring-hero border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">{t('analytics_chart_label')}</p>
                <p className="text-[28px] font-black text-slate-900 mt-1 tabular-nums">94.2<span className="text-[16px] text-slate-400">%</span></p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-black text-emerald-700 bg-emerald-100 inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12 12 5 19 12" />
                </svg>
                +3.4%
              </span>
            </div>
            <svg viewBox="0 0 400 140" className="w-full h-[180px]" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#03CBE7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#03CBE7" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ls1" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#03CBE7" />
                  <stop offset="50%" stopColor="#0E6EEA" />
                  <stop offset="100%" stopColor="#00EC81" />
                </linearGradient>
              </defs>
              <g stroke="#E2E8F0" strokeWidth="1">
                <line x1="0" y1="35" x2="400" y2="35" />
                <line x1="0" y1="70" x2="400" y2="70" />
                <line x1="0" y1="105" x2="400" y2="105" />
              </g>
              <path d="M0,90 C30,85 50,70 80,72 S130,55 160,52 S210,38 240,40 S290,30 320,22 S370,18 400,12" fill="none" stroke="url(#ls1)" strokeWidth="3" strokeLinecap="round" />
              <path d="M0,90 C30,85 50,70 80,72 S130,55 160,52 S210,38 240,40 S290,30 320,22 S370,18 400,12 L400,140 L0,140 Z" fill="url(#lg1)" />
              <circle cx="320" cy="22" r="5" fill="#0E6EEA" />
              <circle cx="320" cy="22" r="9" fill="#0E6EEA" opacity="0.25" />
            </svg>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">{t('analytics_stat1_label')}</p>
                <p className="text-[13px] font-black text-slate-900 mt-1">{t('mockup_top_group')}</p>
                <p className="text-[11px] text-emerald-600 font-bold tabular-nums">98.1%</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">{t('analytics_stat2_label')}</p>
                <p className="text-[13px] font-black text-slate-900 mt-1">{t('mockup_attention_group')}</p>
                <p className="text-[11px] text-amber-600 font-bold tabular-nums">82.4%</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">{t('analytics_stat3_label')}</p>
                <p className="text-[13px] font-black text-slate-900 mt-1 tabular-nums">4.32</p>
                <p className="text-[11px] text-emerald-600 font-bold">↑ +0.18</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] brand-grad-text">{t('analytics_eyebrow')}</p>
          <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight text-slate-900">
            {t('analytics_title_1')}<br />
            {t('analytics_title_2')}
          </h2>
          <p className="mt-5 text-[15px] lg:text-[16px] leading-relaxed text-slate-600 max-w-[520px]">
            {t('analytics_desc')}
          </p>
          <ul className="mt-8 space-y-4">
            <li className="flex gap-4">
              <span className="size-9 rounded-xl flex items-center justify-center brand-grad text-white shrink-0">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
              </span>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{t('analytics_li1_title')}</p>
                <p className="text-[13px] text-slate-600 mt-0.5">{t('analytics_li1_desc')}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="size-9 rounded-xl flex items-center justify-center text-emerald-700 shrink-0" style={{ background: 'linear-gradient(135deg,#DCFCE7,#A7F3D0)' }}>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" /><path d="M5 18l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
                </svg>
              </span>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{t('analytics_li2_title')}</p>
                <p className="text-[13px] text-slate-600 mt-0.5">{t('analytics_li2_desc')}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="size-9 rounded-xl flex items-center justify-center text-blue-700 shrink-0" style={{ background: 'linear-gradient(135deg,#DBEAFE,#CFFAFE)' }}>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18M5 8l7-5 7 5M5 8v8l7 5 7-5V8" />
                </svg>
              </span>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{t('analytics_li3_title')}</p>
                <p className="text-[13px] text-slate-600 mt-0.5">{t('analytics_li3_desc')}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

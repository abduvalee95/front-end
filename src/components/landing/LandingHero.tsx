'use client';

import Link from 'next/link';
import { useTranslations } from '@/i18n/index';
import { ArrowIcon, STUDENTS, DAYS, MARQUEE_NAMES, dotColor } from './shared';

export function LandingHero() {
  const t = useTranslations('landing');

  return (
    <section className="relative overflow-hidden landing-mesh-bg landing-grain">
      <div className="absolute inset-x-0 top-0 h-[480px] landing-dot-grid opacity-40 pointer-events-none"></div>

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-10 lg:pt-14 pb-10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">

          {/* Copy */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold ring-soft">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] brand-grad">{t('badge_new')}</span>
              <span className="text-slate-700">{t('badge_v2')}</span>
              <svg viewBox="0 0 24 24" className="size-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>

            <h1 className="mt-4 text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.06] font-black tracking-[-0.025em] text-slate-900">
              {t('hero_title_1')}<br />
              <span className="brand-grad-text">{t('hero_title_2')}</span> {t('hero_title_3')}
            </h1>

            <p className="mt-4 text-[14.5px] lg:text-[15.5px] leading-[1.55] text-slate-600 max-w-[480px]">
              {t('hero_desc')}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold brand-grad" style={{ boxShadow: '0 12px 28px -12px rgba(14,110,234,0.55)' }}>
                {t('hero_cta')}
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-800 text-[13px] font-bold bg-white border border-slate-200 hover:bg-slate-50 ring-soft">
                <span className="size-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="size-3" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
                {t('hero_demo')}
              </button>
            </div>

            <p className="mt-3 text-[11.5px] font-semibold text-slate-500">
              {t('hero_trust')}
            </p>

            <div className="mt-6 flex items-center gap-5">
              <div className="flex -space-x-2">
                <div className="size-8 rounded-full ring-2 ring-white brand-grad text-white text-[10px] font-black flex items-center justify-center">MT</div>
                <div className="size-8 rounded-full ring-2 ring-white text-white text-[10px] font-black flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0E6EEA,#0f172a)' }}>AR</div>
                <div className="size-8 rounded-full ring-2 ring-white text-white text-[10px] font-black flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00EC81,#03CBE7)' }}>KS</div>
                <div className="size-8 rounded-full ring-2 ring-white bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center">+</div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                      <path d="M12 17.3L5.8 21l1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7L18.2 21z" />
                    </svg>
                  ))}
                  <span className="text-slate-800 font-bold ml-1 text-[12px]">4.9</span>
                </div>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">{t('hero_social_proof')}</p>
              </div>
            </div>
          </div>

          {/* MOCKUP */}
          <div className="relative">
            {/* Floating cards */}
            <div className="absolute -left-4 top-6 z-20 rounded-xl bg-white ring-soft border border-slate-200 px-3 py-2.5 w-[200px] landing-float-y" style={{ animationDelay: '.4s' }}>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg brand-grad flex items-center justify-center text-white shrink-0">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900">{t('float_saved')}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{t('float_saved_sub')}</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 bottom-12 z-20 rounded-xl bg-white ring-soft border border-slate-200 px-3 py-2.5 w-[210px] landing-float-y" style={{ animationDelay: '1.6s' }}>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg flex items-center justify-center text-emerald-700 shrink-0" style={{ background: 'linear-gradient(135deg,#DCFCE7,#CFFAFE)' }}>
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 17 9 11 13 15 21 7" /><polyline points="14 7 21 7 21 14" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900">{t('float_avg')}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{t('float_avg_sub')} <b className="text-emerald-600">+8%</b></p>
                </div>
              </div>
            </div>

            {/* Main mockup window */}
            <div className="relative rounded-[22px] bg-white ring-hero border border-slate-200 overflow-hidden">
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
                <span className="size-2.5 rounded-full bg-red-400/80"></span>
                <span className="size-2.5 rounded-full bg-amber-400/80"></span>
                <span className="size-2.5 rounded-full bg-emerald-400/80"></span>
                <div className="ml-3 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10.5px] font-mono text-slate-500">
                  {t('mockup_url')}
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live</span>
                </div>
              </div>

              <div className="flex h-[300px]">
                {/* Sidebar */}
                <div className="w-[44px] shrink-0 text-white py-3 flex flex-col items-center gap-2" style={{ background: 'linear-gradient(180deg, #0f172a, #1e3a8a)' }}>
                  <div className="size-8 rounded-lg brand-grad flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.9 4.9L19 9.7l-3.8 3.4 1 5.2L12 16l-4.2 2.3 1-5.2L5 9.7l5.1-1.8z" />
                    </svg>
                  </div>
                  <div className="h-px w-6 bg-white/10 my-1"></div>
                  <span className="size-7 rounded-lg flex items-center justify-center bg-white/10 text-white/70">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </span>
                  <span className="size-7 rounded-lg brand-grad text-white flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6l2 2h12v15H2z" />
                    </svg>
                  </span>
                  <span className="size-7 rounded-lg text-white/50 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" />
                    </svg>
                  </span>
                </div>

                {/* Main pane */}
                <div className="flex-1 p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <div>
                      <p className="text-[14px] font-black text-slate-900 leading-none">{t('mockup_journal_title')}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">{t('mockup_current_month')}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-slate-100">
                      <span className="px-2 py-1 rounded-md bg-white text-[10px] font-bold text-slate-700 shadow-sm">{t('mockup_month')}</span>
                      <span className="px-2 py-1 text-[10px] font-bold text-slate-500">{t('mockup_week')}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    {/* Header row */}
                    <div className="grid text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200" style={{ gridTemplateColumns: '80px repeat(12, 1fr)' }}>
                      <div className="px-2 py-2">{t('mockup_student')}</div>
                      {DAYS.map((d, i) => (
                        <div key={i} className={`px-1 py-2 text-center ${i === 11 ? 'text-slate-400' : ''}`}>{d}</div>
                      ))}
                    </div>
                    {/* Data rows */}
                    {STUDENTS.slice(0, 4).map((s) => (
                      <div key={s.init} className="grid border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors" style={{ gridTemplateColumns: '80px repeat(12, 1fr)' }}>
                        <div className="px-2 py-2 flex items-center gap-1.5">
                          <div className="size-5 rounded-full brand-grad text-white text-[8px] font-black flex items-center justify-center shrink-0">{s.init[0]}</div>
                          <span className="text-[10px] font-semibold text-slate-800 truncate">{s.name}</span>
                        </div>
                        {s.pattern.split('').map((ch, i) => (
                          <div key={i} className="flex items-center justify-center py-2">
                            <span className={`size-2 rounded-full ${dotColor(ch)}`}></span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-emerald-500"></span>{t('journal_status_present')}</span>
                    <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-amber-400"></span>{t('journal_status_late')}</span>
                    <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-red-400"></span>{t('journal_status_absent')}</span>
                    <span className="ml-auto font-mono text-[10px] text-slate-400">{t('journal_saved')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 -inset-8 brand-grad opacity-[0.18] rounded-[40px] blur-3xl"></div>
          </div>
        </div>
      </div>

      {/* Logo strip / marquee */}
      <div className="relative border-t border-slate-200/70" style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-4 flex items-center gap-6">
          <p className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-500 shrink-0 hidden md:block">
            {t('marquee_trust')}
          </p>
          <div className="landing-marquee flex-1 overflow-hidden">
            <div className="landing-marquee-track flex items-center gap-12 whitespace-nowrap w-max">
              {[...MARQUEE_NAMES, ...MARQUEE_NAMES].map((name, i) => (
                <span key={i} className={`text-[18px] font-black tracking-tight text-slate-400${i % 2 === 1 ? ' italic' : ''}`}>{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useTranslations } from '@/i18n/index';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const STUDENTS = [
  { name: 'Aliyev S.', init: 'AS', pattern: 'PPPLPPPPPPP.' },
  { name: 'Karimova M.', init: 'KM', pattern: 'PPPPPPPPPLP.' },
  { name: 'Rustamov J.', init: 'RJ', pattern: 'PPALPAPPPPP.' },
  { name: 'Yusupova D.', init: 'YD', pattern: 'PPPPPPPPPPP.' },
  { name: 'Saidov B.', init: 'SB', pattern: 'PPPPLPPPPAP.' },
  { name: 'Tursunova S.', init: 'TS', pattern: 'PPPPPPPLPPP.' },
];

const DAYS = ['04', '06', '08', '11', '13', '15', '18', '20', '22', '25', '27', '29'];

function dotColor(ch: string) {
  if (ch === 'P') return 'bg-emerald-500';
  if (ch === 'L') return 'bg-amber-400';
  if (ch === 'A') return 'bg-red-400';
  return 'bg-slate-200';
}

const MARQUEE_NAMES = [
  'EduTech Toshkent', 'Bilim Maskani', 'IELTS PRO ·', 'Najot Ta\'lim',
  'PDP Academy', 'Smart Kids', 'Buxoro Edu', 'Andijon IT',
];

const SPOTLIGHT_STUDENTS = [
  { init: 'AS', name: 'Aliyev Sardor', status: 'present', statusColor: 'text-emerald-600', dotColor: 'bg-emerald-500', grade: '5' },
  { init: 'KM', name: 'Karimova Malika', status: 'present', statusColor: 'text-emerald-600', dotColor: 'bg-emerald-500', grade: '4' },
  { init: 'RJ', name: 'Rustamov Jasur', status: 'late', statusColor: 'text-amber-600', dotColor: 'bg-amber-400', grade: '4' },
  { init: 'YD', name: 'Yusupova Dilnoza', status: 'present', statusColor: 'text-emerald-600', dotColor: 'bg-emerald-500', grade: '5' },
];

export default function LandingPage() {
  const t = useTranslations('landing');

  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
  ];

  const stats = [
    { num: '240+', label: t('stats_centers') },
    { num: '4 800', label: t('stats_teachers') },
    { num: '78k', label: t('stats_students') },
    { num: '99.97%', label: t('stats_uptime') },
  ];

  return (
    <div className="bg-white antialiased" style={{ color: '#0B1437', fontFamily: 'var(--font-geist-sans), Aptos, "Segoe UI", system-ui, sans-serif' }}>

      {/* NAV */}
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

      {/* HERO */}
      <section className="relative overflow-hidden landing-mesh-bg landing-grain">
        <div className="absolute inset-x-0 top-0 h-[680px] landing-dot-grid opacity-50 pointer-events-none"></div>

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-16 lg:pt-24 pb-20">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">

            {/* Copy */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11.5px] font-bold ring-soft">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] brand-grad">{t('badge_new')}</span>
                <span className="text-slate-700">{t('badge_v2')}</span>
                <svg viewBox="0 0 24 24" className="size-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>

              <h1 className="mt-6 text-[44px] sm:text-[54px] lg:text-[64px] leading-[1.02] font-black tracking-[-0.02em] text-slate-900">
                {t('hero_title_1')}<br />
                <span className="brand-grad-text">{t('hero_title_2')}</span> {t('hero_title_3')}
              </h1>

              <p className="mt-5 text-[16.5px] lg:text-[17.5px] leading-[1.55] text-slate-600 max-w-[520px]">
                {t('hero_desc')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-white text-[14px] font-bold brand-grad" style={{ boxShadow: '0 16px 36px -14px rgba(14,110,234,0.55)' }}>
                  {t('hero_cta')}
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <button className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-slate-800 text-[14px] font-bold bg-white border border-slate-200 hover:bg-slate-50 ring-soft">
                  <span className="size-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="size-3" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  {t('hero_demo')}
                </button>
              </div>

              <p className="mt-4 text-[12px] font-semibold text-slate-500">
                {t('hero_trust')}
              </p>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  <div className="size-9 rounded-full ring-2 ring-white brand-grad text-white text-[11px] font-black flex items-center justify-center">MT</div>
                  <div className="size-9 rounded-full ring-2 ring-white text-white text-[11px] font-black flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0E6EEA,#0f172a)' }}>AR</div>
                  <div className="size-9 rounded-full ring-2 ring-white text-white text-[11px] font-black flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00EC81,#03CBE7)' }}>KS</div>
                  <div className="size-9 rounded-full ring-2 ring-white bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center">+</div>
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
              <div className="absolute -left-6 top-10 z-20 rounded-2xl bg-white ring-soft border border-slate-200 px-3.5 py-3 w-[230px] landing-float-y" style={{ animationDelay: '.4s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl brand-grad flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-black text-slate-900">{t('float_saved')}</p>
                    <p className="text-[10.5px] text-slate-500 font-medium">{t('float_saved_sub')}</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-16 z-20 rounded-2xl bg-white ring-soft border border-slate-200 px-3.5 py-3 w-[240px] landing-float-y" style={{ animationDelay: '1.6s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl flex items-center justify-center text-emerald-700" style={{ background: 'linear-gradient(135deg,#DCFCE7,#CFFAFE)' }}>
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 17 9 11 13 15 21 7" /><polyline points="14 7 21 7 21 14" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-black text-slate-900">{t('float_avg')}</p>
                    <p className="text-[10.5px] text-slate-500 font-medium">{t('float_avg_sub')} <b className="text-emerald-600">+8%</b></p>
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
                    bilimnuru.uz/jurnal/5-A
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live</span>
                  </div>
                </div>

                <div className="flex h-[420px]">
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
                        <p className="text-[14px] font-black text-slate-900 leading-none">5-A · Ingliz tili</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold">Joriy oy: May 2026</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-slate-100">
                        <span className="px-2 py-1 rounded-md bg-white text-[10px] font-bold text-slate-700 shadow-sm">Oy</span>
                        <span className="px-2 py-1 text-[10px] font-bold text-slate-500">Hafta</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                      {/* Header row */}
                      <div className="grid text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200" style={{ gridTemplateColumns: '80px repeat(12, 1fr)' }}>
                        <div className="px-2 py-2">O&apos;quvchi</div>
                        {DAYS.map((d, i) => (
                          <div key={i} className={`px-1 py-2 text-center ${i === 11 ? 'text-slate-400' : ''}`}>{d}</div>
                        ))}
                      </div>
                      {/* Data rows */}
                      {STUDENTS.map((s) => (
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
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 flex items-center gap-6">
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

      {/* FEATURES */}
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
                  {['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sh', 'Ya', 'Du'].map((d) => <span key={d}>{d}</span>)}
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
                <span>Yangi 38</span><span>Aloqa 21</span><span>Imzo 14</span><span>—</span>
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
                <p className="text-[12.5px] font-semibold text-slate-700 leading-snug mt-1">Sardor bugun darsda. Baho: <b>5</b>. Mavzu: Past Perfect.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT 1 — Journal (dark) */}
      <section id="journal" className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(180deg,#0B1437,#0f172a)' }}>
        <div className="absolute inset-0 landing-dot-grid opacity-10 pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 size-[480px] rounded-full brand-grad opacity-20 blur-3xl"></div>

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: '#03CBE7' }}>{t('journal_eyebrow')}</p>
            <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight">
              {t('journal_title_1')}<br />
              <span className="brand-grad-text">{t('journal_title_2')}</span>
            </h2>
            <p className="mt-5 text-[15px] lg:text-[16px] leading-relaxed text-slate-300 max-w-[500px]">
              {t('journal_desc')}
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-[10.5px] font-black uppercase tracking-wider" style={{ color: '#00EC81' }}>{t('journal_stat1_label')}</p>
                <p className="mt-2 text-[28px] font-black tabular-nums">‹ 30s</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{t('journal_stat1_sub')}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-[10.5px] font-black uppercase tracking-wider" style={{ color: '#03CBE7' }}>{t('journal_stat2_label')}</p>
                <p className="mt-2 text-[28px] font-black tabular-nums">∞</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{t('journal_stat2_sub')}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[t('journal_tag1'), t('journal_tag2'), t('journal_tag3'), t('journal_tag4')].map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-semibold">{tag}</span>
              ))}
            </div>
          </div>

          {/* Journal card mockup */}
          <div className="relative">
            <div className="rounded-2xl bg-white text-slate-800 ring-hero overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
                <span className="size-9 rounded-xl brand-grad text-white text-[11px] font-black flex items-center justify-center">5-A</span>
                <div>
                  <p className="text-[13px] font-black text-slate-900">Ingliz tili · A2</p>
                  <p className="text-[10.5px] font-semibold text-slate-500">18 o&apos;quvchi · Ma-Cho-Ju</p>
                </div>
                <button className="ml-auto px-3 py-1.5 rounded-lg brand-grad text-white text-[11.5px] font-bold inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t('journal_lesson_btn')}
                </button>
              </div>
              <div className="p-5 space-y-2">
                {SPOTLIGHT_STUDENTS.map((s) => (
                  <div key={s.init} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="size-8 rounded-lg brand-grad text-white text-[10px] font-black flex items-center justify-center">{s.init}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-bold text-slate-900">{s.name}</p>
                      <p className={`text-[10.5px] font-semibold ${s.statusColor}`}>
                        {s.status === 'late' ? t('journal_status_late') : t('journal_status_present')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${s.dotColor}`}></span>
                      <span className="text-[13px] font-black text-slate-900">{s.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 left-6 rounded-full bg-white px-3 py-1.5 text-[10.5px] font-black text-slate-700 ring-soft border border-slate-200">
              <span className="text-emerald-600">●</span> {t('journal_updated')}
            </div>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT 2 — Analytics */}
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
                  <p className="text-[13px] font-black text-slate-900 mt-1">IELTS Intensive</p>
                  <p className="text-[11px] text-emerald-600 font-bold tabular-nums">98.1%</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">{t('analytics_stat2_label')}</p>
                  <p className="text-[13px] font-black text-slate-900 mt-1">7-B Matem.</p>
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

      {/* STATS BAR */}
      <section className="relative py-16 brand-grad">
        <div className="absolute inset-0 landing-dot-grid opacity-20 pointer-events-none"></div>
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {stats.map((s) => (
            <div key={s.label} className="text-white">
              <p className="text-[48px] lg:text-[64px] font-black tracking-tight leading-none tabular-nums">{s.num}</p>
              <p className="mt-2 text-[12px] font-bold uppercase tracking-wider opacity-90">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="max-w-[640px] mb-14">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] brand-grad-text">{t('testimonials_eyebrow')}</p>
            <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight text-slate-900">{t('testimonials_title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <figure className="rounded-3xl bg-white border border-slate-200 p-7 ring-soft">
              <svg viewBox="0 0 24 24" className="size-6 text-slate-300" fill="currentColor">
                <path d="M6 17a4 4 0 014-4V8a8 8 0 00-8 8h4zm12 0a4 4 0 014-4V8a8 8 0 00-8 8h4z" />
              </svg>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-slate-800 font-medium">
                {t('testimonial1_quote')}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="size-10 rounded-full brand-grad text-white text-[12px] font-black flex items-center justify-center">MT</div>
                <div>
                  <p className="text-[13px] font-black text-slate-900">{t('testimonial1_name')}</p>
                  <p className="text-[11.5px] font-semibold text-slate-500">{t('testimonial1_role')}</p>
                </div>
              </figcaption>
            </figure>

            <figure className="rounded-3xl bg-white border border-slate-200 p-7 ring-soft">
              <svg viewBox="0 0 24 24" className="size-6 text-slate-300" fill="currentColor">
                <path d="M6 17a4 4 0 014-4V8a8 8 0 00-8 8h4zm12 0a4 4 0 014-4V8a8 8 0 00-8 8h4z" />
              </svg>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-slate-800 font-medium">
                {t('testimonial2_quote')}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="size-10 rounded-full text-white text-[12px] font-black flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0E6EEA,#0f172a)' }}>AR</div>
                <div>
                  <p className="text-[13px] font-black text-slate-900">{t('testimonial2_name')}</p>
                  <p className="text-[11.5px] font-semibold text-slate-500">{t('testimonial2_role')}</p>
                </div>
              </figcaption>
            </figure>

            <figure className="rounded-3xl border border-slate-200 p-7 ring-soft text-white" style={{ background: 'linear-gradient(180deg,#0B1437,#1e3a8a)' }}>
              <svg viewBox="0 0 24 24" className="size-6 opacity-50" fill="currentColor" style={{ color: '#03CBE7' }}>
                <path d="M6 17a4 4 0 014-4V8a8 8 0 00-8 8h4zm12 0a4 4 0 014-4V8a8 8 0 00-8 8h4z" />
              </svg>
              <blockquote className="mt-4 text-[15px] leading-relaxed font-medium">
                {t('testimonial3_quote')}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="size-10 rounded-full text-slate-900 text-[12px] font-black flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00EC81,#03CBE7)' }}>KS</div>
                <div>
                  <p className="text-[13px] font-black text-white">{t('testimonial3_name')}</p>
                  <p className="text-[11.5px] font-semibold opacity-60">{t('testimonial3_role')}</p>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-[640px] mx-auto mb-14">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] brand-grad-text">{t('pricing_eyebrow')}</p>
            <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight text-slate-900">{t('pricing_title')}</h2>
            <p className="mt-4 text-[15px] text-slate-600">{t('pricing_desc')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-[1080px] mx-auto">
            {/* Start */}
            <div className="rounded-3xl bg-white border border-slate-200 p-7 ring-soft">
              <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">{t('plan_start_name')}</p>
              <p className="mt-3 text-[13px] text-slate-500">{t('plan_start_limit')}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-[48px] font-black tracking-tight text-slate-900 tabular-nums">290k</span>
                <span className="text-[13px] font-bold text-slate-500">so&apos;m / oy</span>
              </div>
              <Link href="/login" className="mt-6 block text-center px-4 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 hover:bg-slate-50">{t('plan_start_cta')}</Link>
              <ul className="mt-6 space-y-2.5 text-[13px] text-slate-700">
                {[t('plan_start_f1'), t('plan_start_f2'), t('plan_start_f3')].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="size-4 rounded-md landing-check flex items-center justify-center shrink-0 mt-0.5"><CheckIcon /></span>
                    {item}
                  </li>
                ))}
                {['Moliya moduli', 'API'].map((item) => (
                  <li key={item} className="flex gap-2 text-slate-400">
                    <span className="size-4 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro (featured) */}
            <div className="relative rounded-3xl p-7 text-white" style={{ background: 'linear-gradient(180deg,#0B1437,#1e3a8a)', boxShadow: '0 30px 80px -40px rgba(14,110,234,0.55)' }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full brand-grad text-white text-[10.5px] font-black uppercase tracking-wider">{t('plan_pro_badge')}</span>
              <p className="text-[12px] font-black uppercase tracking-wider" style={{ color: '#03CBE7' }}>{t('plan_pro_name')}</p>
              <p className="mt-3 text-[13px] opacity-80">{t('plan_pro_limit')}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-[48px] font-black tracking-tight tabular-nums">890k</span>
                <span className="text-[13px] font-bold opacity-70">so&apos;m / oy</span>
              </div>
              <Link href="/login" className="mt-6 block text-center px-4 py-3 rounded-xl brand-grad text-white text-[13px] font-bold">{t('plan_pro_cta')}</Link>
              <ul className="mt-6 space-y-2.5 text-[13px] opacity-90">
                {[t('plan_pro_f1'), t('plan_pro_f2'), t('plan_pro_f3'), t('plan_pro_f4'), t('plan_pro_f5')].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="size-4 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg,#00EC81,#03CBE7)', color: '#0B1437' }}><CheckIcon /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div className="rounded-3xl bg-white border border-slate-200 p-7 ring-soft">
              <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">{t('plan_net_name')}</p>
              <p className="mt-3 text-[13px] text-slate-500">{t('plan_net_limit')}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-[48px] font-black tracking-tight text-slate-900">{t('plan_net_price')}</span>
              </div>
              <Link href="/login" className="mt-6 block text-center px-4 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 hover:bg-slate-50">{t('plan_net_cta')}</Link>
              <ul className="mt-6 space-y-2.5 text-[13px] text-slate-700">
                {[t('plan_net_f1'), t('plan_net_f2'), t('plan_net_f3'), t('plan_net_f4'), t('plan_net_f5')].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="size-4 rounded-md landing-check flex items-center justify-center shrink-0 mt-0.5"><CheckIcon /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-[12px] text-slate-500 font-medium mt-8">
            {t('pricing_annual_note')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-[820px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] brand-grad-text">{t('faq_eyebrow')}</p>
            <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight text-slate-900">{t('faq_title')}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-2xl bg-white border border-slate-200 px-6 py-5">
                <summary className="flex items-center gap-4">
                  <span className="text-[15px] font-black text-slate-900 flex-1">{item.q}</span>
                  <span className="faq-icon size-7 rounded-full brand-grad text-white flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-[14px] text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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

      {/* FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="size-10 rounded-xl brand-grad flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 4.9L19 9.7l-3.8 3.4 1 5.2L12 16l-4.2 2.3 1-5.2L5 9.7l5.1-1.8z" />
                </svg>
              </span>
              <div className="leading-tight">
                <p className="text-[16px] font-black text-slate-900">Bilim Nuru</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 -mt-0.5">Education OS</p>
              </div>
            </div>
            <p className="mt-5 text-[13.5px] text-slate-600 max-w-[320px] leading-relaxed">
              {t('footer_tagline')}
            </p>
            <p className="mt-5 text-[11.5px] text-slate-500 font-mono">support@bilimnuru.uz · +998 71 200 12 12</p>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('footer_col1')}</p>
            <ul className="mt-4 space-y-2.5 text-[13px] font-semibold text-slate-700">
              {[t('footer_p1_l1'), t('footer_p1_l2'), t('footer_p1_l3'), t('footer_p1_l4'), t('footer_p1_l5')].map((l) => (
                <li key={l}><a href="#" className="hover:text-slate-900">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('footer_col2')}</p>
            <ul className="mt-4 space-y-2.5 text-[13px] font-semibold text-slate-700">
              {[t('footer_p2_l1'), t('footer_p2_l2'), t('footer_p2_l3'), t('footer_p2_l4'), t('footer_p2_l5')].map((l) => (
                <li key={l}><a href="#" className="hover:text-slate-900">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('footer_col3')}</p>
            <ul className="mt-4 space-y-2.5 text-[13px] font-semibold text-slate-700">
              {[t('footer_p3_l1'), t('footer_p3_l2'), t('footer_p3_l3'), t('footer_p3_l4'), t('footer_p3_l5')].map((l) => (
                <li key={l}><a href="#" className="hover:text-slate-900">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 flex flex-wrap items-center gap-4 justify-between">
            <p className="text-[11.5px] text-slate-500 font-medium">{t('footer_copyright')}</p>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-[11.5px] font-mono">v2.4.1 · operational</span>
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

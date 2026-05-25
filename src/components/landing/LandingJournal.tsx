'use client';

import { useTranslations } from '@/i18n/index';
import { SPOTLIGHT_STUDENTS } from './shared';

export function LandingJournal() {
  const t = useTranslations('landing');

  return (
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
                <p className="text-[13px] font-black text-slate-900">{t('mockup_course_name')}</p>
                <p className="text-[10.5px] font-semibold text-slate-500">{t('mockup_course_info')}</p>
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
  );
}

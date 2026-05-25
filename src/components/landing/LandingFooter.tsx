'use client';

import { useTranslations } from '@/i18n/index';

export function LandingFooter() {
  const t = useTranslations('landing');

  return (
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
          <p className="mt-5 text-[11.5px] text-slate-500 font-mono">support@bilimnuru · +996 505004411</p>
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
  );
}

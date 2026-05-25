'use client';

import { useTranslations } from '@/i18n/index';

export function LandingTestimonials() {
  const t = useTranslations('landing');

  return (
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
  );
}

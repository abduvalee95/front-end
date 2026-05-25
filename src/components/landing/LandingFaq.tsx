'use client';

import { useTranslations } from '@/i18n/index';

interface FaqItem {
  q: string;
  a: string;
}

interface LandingFaqProps {
  faqs: FaqItem[];
}

export function LandingFaq({ faqs }: LandingFaqProps) {
  const t = useTranslations('landing');

  return (
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
  );
}

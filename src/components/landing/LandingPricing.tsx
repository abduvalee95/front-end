'use client';

import Link from 'next/link';
import { useTranslations } from '@/i18n/index';
import { CheckIcon } from './shared';

export function LandingPricing() {
  const t = useTranslations('landing');

  return (
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
              <span className="text-[48px] font-black tracking-tight text-slate-900 tabular-nums">{t('plan_start_price')}</span>
              <span className="text-[13px] font-bold text-slate-500">{t('plan_start_price_unit')}</span>
            </div>
            <Link href="/login" className="mt-6 block text-center px-4 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 hover:bg-slate-50">{t('plan_start_cta')}</Link>
            <ul className="mt-6 space-y-2.5 text-[13px] text-slate-700">
              {[t('plan_start_f1'), t('plan_start_f2'), t('plan_start_f3')].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="size-4 rounded-md landing-check flex items-center justify-center shrink-0 mt-0.5"><CheckIcon /></span>
                  {item}
                </li>
              ))}
              {[t('plan_start_disabled1'), t('plan_start_disabled2')].map((item) => (
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
              <span className="text-[48px] font-black tracking-tight tabular-nums">{t('plan_pro_price')}</span>
              <span className="text-[13px] font-bold opacity-70">{t('plan_pro_price_unit')}</span>
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
  );
}

'use client';

import { useTranslations } from '@/i18n/index';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingJournal } from '@/components/landing/LandingJournal';
import { LandingAnalytics } from '@/components/landing/LandingAnalytics';
import { LandingStatsBar } from '@/components/landing/LandingStatsBar';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { LandingCta } from '@/components/landing/LandingCta';
import { LandingFooter } from '@/components/landing/LandingFooter';

export function LandingPageClient() {
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
    <div className="landing-surface bg-white text-[#0F1729] antialiased" style={{ fontFamily: 'var(--font-sans)' }}>
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingJournal />
      <LandingAnalytics />
      <LandingStatsBar stats={stats} />
      <LandingTestimonials />
      <LandingPricing />
      <LandingFaq faqs={faqs} />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}

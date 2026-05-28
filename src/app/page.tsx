import type { Metadata } from 'next';
import { LandingPageClient } from '@/components/landing/LandingPageClient';

// NOTE: Add a real OG image at /public/og-image.png (1200×630px) to activate the
// openGraph and twitter card images below.
export const metadata: Metadata = {
  title: "Bilim Nuru — O'quv markaz uchun CRM + LMS",
  description:
    "O'quv markazlar uchun to'liq boshqaruv tizimi. O'quvchilar, guruhlar, to'lovlar, dars jadvali va tahlillar bir joyda.",
  openGraph: {
    title: "Bilim Nuru — O'quv markaz uchun CRM + LMS",
    description:
      "O'quv markazlar uchun to'liq boshqaruv tizimi. O'quvchilar, guruhlar, to'lovlar, dars jadvali va tahlillar bir joyda.",
    // TODO: re-enable when /public/og-image.png exists
    // images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Bilim Nuru' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Bilim Nuru — O'quv markaz uchun CRM + LMS",
    description:
      "O'quv markazlar uchun to'liq boshqaruv tizimi.",
    // images: ['/og-image.png'],
  },
  // Allow indexing for the public landing page
  robots: { index: true, follow: true },
};

export default function LandingPage() {
  return <LandingPageClient />;
}

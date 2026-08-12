import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { cookies } from 'next/headers';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/routing';
import { I18nProvider } from '@/i18n/index';
import { Providers } from "@/components/providers";
import "./globals.css";

// Single family for the entire product — see src/app/globals.css (--font-sans).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://bilimnuru.uz'),
  title: {
    template: '%s — Bilim Nuru',
    default: 'Bilim Nuru — CRM + LMS',
  },
  description: "O'quv markazlar uchun zamonaviy CRM va LMS platformasi. O'quvchilar, guruhlar, to'lovlar va darslar boshqaruvi.",
  applicationName: "Bilim Nuru",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bilim Nuru",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Bilim Nuru',
    title: 'Bilim Nuru — CRM + LMS',
    description: "O'quv markazlar uchun zamonaviy boshqaruv platformasi.",
    // Image is auto-attached by Next.js from src/app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bilim Nuru — CRM + LMS',
    description: "O'quv markazlar uchun zamonaviy boshqaruv platformasi.",
    // Image is auto-attached by Next.js from src/app/twitter-image.tsx
  },
  // Robots policy is per-route. Landing page (/) is indexable.
  // App routes set their own `robots: { index: false }` in their layouts and
  // are also blocked at /robots.txt. No site-wide noindex here so the landing
  // page metadata isn't overridden.
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B111F" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: Locale = (raw && (LOCALES as ReadonlyArray<string>).includes(raw))
    ? (raw as Locale)
    : DEFAULT_LOCALE;
  const messages = ((await import(`../../messages/${locale}.json`)) as { default: Record<string, unknown> }).default;

  return (
    <html lang={locale} suppressHydrationWarning={true}>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider locale={locale} messages={messages}>
          <Providers>
            {children}
          </Providers>
        </I18nProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

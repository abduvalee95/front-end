import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Syne, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cookies } from 'next/headers';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/routing';
import { I18nProvider } from '@/i18n/index';
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Bilim Nuru' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bilim Nuru — CRM + LMS',
    description: "O'quv markazlar uchun zamonaviy boshqaruv platformasi.",
    images: ['/og-image.png'],
  },
  // Private SaaS — do not index app routes
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1437" },
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
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} ${jetbrainsMono.variable} antialiased`}
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

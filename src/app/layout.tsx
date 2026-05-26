import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cookies } from 'next/headers';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/routing';
import { I18nProvider } from '@/i18n/index';
import { Providers } from "@/components/providers";
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bilim Nuru — CRM + LMS",
  description: "Modern Education Management Platform",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider locale={locale} messages={messages}>
          <Providers>
            {children}
          </Providers>
        </I18nProvider>
        <Toaster position="top-right" richColors closeButton />
        <SpeedInsights />
      </body>
    </html>
  );
}

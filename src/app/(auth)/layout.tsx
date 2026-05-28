/**
 * Auth Layout
 * Minimal layout for authentication pages
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kirish — Bilim Nuru',
  description: "Bilim Nuru hisobingizga kirish.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" suppressHydrationWarning>
      {children}
    </div>
  );
}

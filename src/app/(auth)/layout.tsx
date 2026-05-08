/**
 * Auth Layout
 * Minimal layout for authentication pages
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Bilim Nuru',
  description: 'Sign in to your Bilim Nuru account',
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

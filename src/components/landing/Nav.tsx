'use client';

import Link from 'next/link';
import { Globe, ArrowRight } from 'lucide-react';

export function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 dark:bg-slate-950/80 border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-[68px] flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span
            className="size-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)' }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 4.9L19 9.7l-3.8 3.4 1 5.2L12 16l-4.2 2.3 1-5.2L5 9.7l5.1-1.8z" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Bilim Nuru</p>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-slate-400 -mt-0.5">Education OS</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-1 text-[13.5px] font-semibold text-slate-600 dark:text-slate-400">
          <a href="#features" className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">Imkoniyatlar</a>
          <a href="#journal" className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">Jurnal</a>
          <a href="#analytics" className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">Tahlil</a>
          <a href="#pricing" className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">Narxlar</a>
          <a href="#faq" className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">Savol-javob</a>
        </nav>

        {/* CTA group */}
        <div className="ml-auto flex items-center gap-2">
          <button className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 dark:text-slate-400 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Globe className="size-4" />
            UZ
          </button>
          <Link
            href="/login"
            className="hidden sm:inline-flex text-[13px] font-bold text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Kirish
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white px-4 py-2 rounded-xl transition-opacity hover:opacity-95"
            style={{
              background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)',
              boxShadow: '0 10px 22px -10px rgba(14,110,234,0.55)',
            }}
          >
            Bepul boshlash
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

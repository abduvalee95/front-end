'use client';

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const STUDENTS = [
  { name: 'Aliyev S.', init: 'AS', pattern: 'PPPLPPPPPPP.' },
  { name: 'Karimova M.', init: 'KM', pattern: 'PPPPPPPPPLP.' },
  { name: 'Rustamov J.', init: 'RJ', pattern: 'PPALPAPPPPP.' },
  { name: 'Yusupova D.', init: 'YD', pattern: 'PPPPPPPPPPP.' },
  { name: 'Saidov B.', init: 'SB', pattern: 'PPPPLPPPPAP.' },
  { name: 'Tursunova S.', init: 'TS', pattern: 'PPPPPPPLPPP.' },
];

export const DAYS = ['04', '06', '08', '11', '13', '15', '18', '20', '22', '25', '27', '29'];

export function dotColor(ch: string) {
  if (ch === 'P') return 'bg-emerald-500';
  if (ch === 'L') return 'bg-amber-400';
  if (ch === 'A') return 'bg-red-400';
  return 'bg-slate-200';
}

export const MARQUEE_NAMES = ['Bilim Nuru'];

export const SPOTLIGHT_STUDENTS = [
  { init: 'AS', name: 'Aliyev Sardor', status: 'present', statusColor: 'text-emerald-600', dotColor: 'bg-emerald-500', grade: '5' },
  { init: 'KM', name: 'Karimova Malika', status: 'present', statusColor: 'text-emerald-600', dotColor: 'bg-emerald-500', grade: '4' },
  { init: 'RJ', name: 'Rustamov Jasur', status: 'late', statusColor: 'text-amber-600', dotColor: 'bg-amber-400', grade: '4' },
  { init: 'YD', name: 'Yusupova Dilnoza', status: 'present', statusColor: 'text-emerald-600', dotColor: 'bg-emerald-500', grade: '5' },
] as const;

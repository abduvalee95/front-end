'use client';

interface Stat {
  num: string;
  label: string;
}

interface LandingStatsBarProps {
  stats: Stat[];
}

export function LandingStatsBar({ stats }: LandingStatsBarProps) {
  return (
    <section className="relative py-16 brand-grad">
      <div className="absolute inset-0 landing-dot-grid opacity-20 pointer-events-none"></div>
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
        {stats.map((s) => (
          <div key={s.label} className="text-white">
            <p className="text-[48px] lg:text-[64px] font-black tracking-tight leading-none tabular-nums">{s.num}</p>
            <p className="mt-2 text-[12px] font-bold uppercase tracking-wider opacity-90">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

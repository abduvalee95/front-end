const STATS = [
  { value: '240+', label: 'Ta\'lim markazi' },
  { value: '4 800', label: 'O\'qituvchi har kuni kiradi' },
  { value: '78k', label: 'O\'quvchi jurnalda' },
  { value: '99.97%', label: 'Tizim ishlash vaqti', isSpecial: true },
];

export function StatsBar() {
  return (
    <section
      className="relative py-16"
      style={{ background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)' }}
    >
      {/* dot grid overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
        {STATS.map(({ value, label, isSpecial }) => (
          <div key={label} className="text-white">
            {isSpecial ? (
              <p className="text-[48px] lg:text-[64px] font-black tracking-tight leading-none tabular-nums">
                99.97<span className="text-[28px]">%</span>
              </p>
            ) : (
              <p className="text-[48px] lg:text-[64px] font-black tracking-tight leading-none tabular-nums">
                {value}
              </p>
            )}
            <p className="mt-2 text-[12px] font-bold uppercase tracking-wider opacity-90">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

import Link from 'next/link';

const BRAND_GRAD = 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)';

const SPOTLIGHT_STUDENTS = [
  { name: 'Aliyev Sardor', avg: '4.8', trend: '+0.2', warn: false },
  { name: 'Karimova Madina', avg: '4.5', trend: '+0.1', warn: false },
  { name: 'Rustamov Jasur', avg: '3.9', trend: '−0.3', warn: true },
  { name: 'Yusupova Dilnoza', avg: '4.7', trend: '+0.4', warn: false },
  { name: 'Saidov Bobur', avg: '4.1', trend: '0.0', warn: false },
];

const INIT_BG = (i: number) =>
  i % 3 === 0
    ? 'linear-gradient(135deg,#03CBE7,#0E6EEA)'
    : i % 3 === 1
    ? 'linear-gradient(135deg,#00EC81,#03CBE7)'
    : 'linear-gradient(135deg,#0E6EEA,#0B1437)';

function initials(name: string) {
  return name.split(' ').map((x) => x[0]).slice(0, 2).join('');
}

export function JournalSpotlight() {
  return (
    <section
      id="journal"
      className="relative overflow-hidden text-white"
      style={{ background: 'linear-gradient(180deg,#0B1437,#0f172a)' }}
    >
      {/* dot grid overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* ambient glow */}
      <div
        className="absolute -top-32 -right-32 size-[480px] rounded-full opacity-20 blur-3xl"
        style={{ background: BRAND_GRAD }}
      />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Copy */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: '#03CBE7' }}>
            01 · Jurnal
          </p>
          <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight">
            Davomat — bir bosishda.<br />
            <span
              style={{
                background: 'linear-gradient(120deg, #03CBE7 0%, #0E6EEA 50%, #00EC81 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Baho — bir bosishda.
            </span>
          </h2>
          <p className="mt-5 text-[15px] lg:text-[16px] leading-relaxed text-slate-300 max-w-[500px]">
            Oylik jadval, kunlik jadval va o&apos;quvchi profili — uchta ko&apos;rinish, bitta jurnal.
            Klaviatura bilan o&apos;qituvchi 18 ta o&apos;quvchiga 30 sekundda baho qo&apos;yadi.
          </p>

          {/* Stats */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <p className="text-[10.5px] font-black uppercase tracking-wider" style={{ color: '#00EC81' }}>Tezlik</p>
              <p className="mt-2 text-[28px] font-black tabular-nums">‹ 30s</p>
              <p className="text-[12px] text-slate-400 mt-0.5">guruhga davomat</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <p className="text-[10.5px] font-black uppercase tracking-wider" style={{ color: '#03CBE7' }}>Tarix</p>
              <p className="mt-2 text-[28px] font-black tabular-nums">∞</p>
              <p className="text-[12px] text-slate-400 mt-0.5">har o&apos;zgartirish saqlanadi</p>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {['Klaviatura bilan ishlash', 'Oflayn rejim', 'Ko\'p o\'qituvchi', 'Excel eksport'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Mini grid card */}
        <div className="relative">
          <div
            className="rounded-2xl bg-white text-slate-800 overflow-hidden"
            style={{
              boxShadow: `
                0 0 0 1px rgba(15,23,42,0.06),
                0 30px 70px -30px rgba(14,110,234,0.35),
                0 60px 140px -60px rgba(0,236,129,0.25)`,
            }}
          >
            {/* Card header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
              <span
                className="size-9 rounded-xl text-white text-[11px] font-black flex items-center justify-center"
                style={{ background: BRAND_GRAD }}
              >
                5-A
              </span>
              <div>
                <p className="text-[13px] font-black text-slate-900">Ingliz tili · A2</p>
                <p className="text-[10.5px] font-semibold text-slate-500">18 o&apos;quvchi · Ma-Cho-Ju</p>
              </div>
              <Link
                href="/login"
                className="ml-auto px-3 py-1.5 rounded-lg text-white text-[11.5px] font-bold inline-flex items-center gap-1.5"
                style={{ background: BRAND_GRAD }}
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Dars
              </Link>
            </div>

            {/* Student rows */}
            <div className="p-5 space-y-2">
              {SPOTLIGHT_STUDENTS.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
                  <span
                    className="size-9 rounded-xl text-white text-[11px] font-black flex items-center justify-center shrink-0"
                    style={{ background: INIT_BG(i) }}
                  >
                    {initials(r.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-900 truncate">{r.name}</p>
                    <p className="text-[11px] font-semibold text-slate-500">O&apos;rtacha bal · so&apos;nggi 4 hafta</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-slate-900 text-white tabular-nums">{r.avg}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-black tabular-nums ${r.warn ? 'text-red-500 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}
                    >
                      {r.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caption pill */}
          <div
            className="absolute -bottom-4 left-6 rounded-full bg-white px-3 py-1.5 text-[10.5px] font-black text-slate-700 border border-slate-200"
            style={{ boxShadow: '0 1px 0 rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.18)' }}
          >
            <span className="text-emerald-600">●</span> 4 daqiqa oldin yangilandi
          </div>
        </div>
      </div>
    </section>
  );
}

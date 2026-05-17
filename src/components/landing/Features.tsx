const BRAND_GRAD = 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)';
const RING_SOFT = '0 1px 0 rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.18)';

function CheckMark({ dark }: { dark?: boolean }) {
  const bg = dark
    ? 'linear-gradient(135deg,#00EC81,#03CBE7)'
    : 'linear-gradient(135deg, rgba(0,236,129,0.18), rgba(3,203,231,0.18))';
  const color = dark ? '#0B1437' : '#047857';
  return (
    <span
      className="size-4 rounded-md flex items-center justify-center shrink-0 mt-0.5"
      style={{ background: bg, color }}
    >
      <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-white dark:bg-slate-950">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div className="max-w-[640px]">
            <p
              className="text-[11px] font-black uppercase tracking-[0.22em]"
              style={{
                background: 'linear-gradient(120deg, #03CBE7 0%, #0E6EEA 50%, #00EC81 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Bitta tizim
            </p>
            <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight text-slate-900 dark:text-white">
              Markazingizning kunlik harakati — to&apos;liq jamlanma
            </h2>
          </div>
          <p className="lg:max-w-[380px] text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Jurnalga kirdingizmi — ish boshlandi. Excel jadvallari, Telegram guruhlar, qog&apos;oz
            daftarchalar keraksiz. <b className="text-slate-800 dark:text-slate-200">Bir nuqtadan boshqaring.</b>
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1 — Jurnal */}
          <article className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 hover:-translate-y-0.5 transition-transform" style={{ boxShadow: RING_SOFT }}>
            <div className="size-12 rounded-2xl flex items-center justify-center text-white" style={{ background: BRAND_GRAD }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h16a2 2 0 012 2v14" /><path d="M2 4v15a1 1 0 001 1h17" /><path d="M7 9h7M7 13h5" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900 dark:text-white">Elektron jurnal</h3>
            <p className="mt-2 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Davomat, baholar va dars mavzulari bitta jadvalda. Avtomatik saqlanadi, ikkita o&apos;qituvchi birgalikda kiritsa konflikt bo&apos;lmaydi.
            </p>
            <ul className="mt-5 space-y-2 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400">
              <li className="flex gap-2"><CheckMark />Bir bosishda davomat</li>
              <li className="flex gap-2"><CheckMark />Bahoning tarixi qoladi</li>
              <li className="flex gap-2"><CheckMark />Excel&apos;ga eksport</li>
            </ul>
          </article>

          {/* 2 — Analytics (dark inverted card) */}
          <article
            className="group relative rounded-3xl p-7 hover:-translate-y-0.5 transition-transform"
            style={{ background: 'linear-gradient(180deg,#0f172a,#1e293b)', boxShadow: RING_SOFT }}
          >
            <div className="size-12 rounded-2xl flex items-center justify-center text-slate-900" style={{ background: 'linear-gradient(135deg,#00EC81,#03CBE7)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-white">Tahlil va hisobotlar</h3>
            <p className="mt-2 text-[14px] text-slate-300 leading-relaxed">
              Har bir o&apos;quvchi, guruh, o&apos;qituvchi bo&apos;yicha davomat va bal dinamikasi. Excel hisobotini bir bosishda yuklab oling.
            </p>
            {/* Mini chart */}
            <div className="mt-6 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="flex items-end gap-1.5 h-[64px]">
                {[35, 55, 42, 78, 62, 88, 74, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: BRAND_GRAD }} />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                {['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sh', 'Ya', 'Du'].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
          </article>

          {/* 3 — Schedule */}
          <article className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 hover:-translate-y-0.5 transition-transform" style={{ boxShadow: RING_SOFT }}>
            <div className="size-12 rounded-2xl flex items-center justify-center text-blue-700" style={{ background: 'linear-gradient(135deg,#DBEAFE,#CFFAFE)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900 dark:text-white">Jadval va xona</h3>
            <p className="mt-2 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Guruhlarni xonalar bilan to&apos;qnashtirmasdan, o&apos;qituvchi yukini ko&apos;rib chiqib jadval tuzasiz. O&apos;quvchi ham, ota-ona ham real vaqtda ko&apos;radi.
            </p>
            <div className="mt-5 grid grid-cols-5 gap-1 text-[10px] font-mono">
              {[
                { label: 'Du', active: false },
                { label: '9:00', active: true },
                { label: 'Cho', active: false },
                { label: '9:00', active: true },
                { label: 'Ju', active: false },
              ].map(({ label, active }, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded flex items-center justify-center font-bold ${active ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
                  style={active ? { background: BRAND_GRAD } : {}}
                >
                  {label}
                </div>
              ))}
            </div>
          </article>

          {/* 4 — Finance */}
          <article className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 hover:-translate-y-0.5 transition-transform" style={{ boxShadow: RING_SOFT }}>
            <div className="size-12 rounded-2xl flex items-center justify-center text-emerald-700" style={{ background: 'linear-gradient(135deg,#DCFCE7,#A7F3D0)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 14h4" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900 dark:text-white">Moliya va to&apos;lovlar</h3>
            <p className="mt-2 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Oylik to&apos;lovlar, qarzdorlik, o&apos;qituvchi maoshi — bitta panelda. Click va Payme to&apos;g&apos;ridan-to&apos;g&apos;ri ulanadi.
            </p>
            <div className="mt-5 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">May tushum</p>
                <p className="text-[18px] font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  42 800 000 <span className="text-[11px] font-bold text-slate-500">so&apos;m</span>
                </p>
              </div>
              <span className="px-2 py-1 rounded-md text-[10.5px] font-black text-emerald-700 bg-emerald-100">+12%</span>
            </div>
          </article>

          {/* 5 — Leads */}
          <article className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 hover:-translate-y-0.5 transition-transform" style={{ boxShadow: RING_SOFT }}>
            <div className="size-12 rounded-2xl flex items-center justify-center text-amber-700" style={{ background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
                <path d="M7 8H5a2 2 0 00-2 2v8a2 2 0 002 2h2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900 dark:text-white">Lid va marketing</h3>
            <p className="mt-2 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Sayt formasidan kelgan har bir lid yo&apos;qolmaydi. Manba, bosqich, mas&apos;ul — bitta voronkada.
            </p>
            <div className="mt-5 flex gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-cyan-400" />
              <div className="flex-1 h-1.5 rounded-full bg-blue-500" />
              <div className="flex-1 h-1.5 rounded-full bg-emerald-500" />
              <div className="flex-1 h-1.5 rounded-full bg-slate-200" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500">
              <span>Yangi 38</span><span>Aloqa 21</span><span>Imzo 14</span><span>—</span>
            </div>
          </article>

          {/* 6 — Parent comms */}
          <article className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 hover:-translate-y-0.5 transition-transform" style={{ boxShadow: RING_SOFT }}>
            <div className="size-12 rounded-2xl flex items-center justify-center text-fuchsia-700" style={{ background: 'linear-gradient(135deg,#FCE7F3,#FBCFE8)' }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4z" />
              </svg>
            </div>
            <h3 className="mt-5 text-[20px] font-black text-slate-900 dark:text-white">Ota-ona aloqasi</h3>
            <p className="mt-2 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Dars yakunlanishi bilanoq SMS yoki Telegram orqali davomat va baho yuboriladi. So&apos;rashga hojat qolmaydi.
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-2.5">
              <p className="text-[10.5px] font-mono text-slate-500">SMS · 17:42</p>
              <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 leading-snug mt-1">
                Sardor bugun darsda. Baho: <b>5</b>. Mavzu: Past Perfect.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

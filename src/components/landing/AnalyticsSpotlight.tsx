const BRAND_GRAD = 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)';

export function AnalyticsSpotlight() {
  return (
    <section id="analytics" className="relative py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Chart card */}
        <div className="order-2 lg:order-1 relative">
          <div
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6"
            style={{
              boxShadow: `
                0 0 0 1px rgba(15,23,42,0.06),
                0 30px 70px -30px rgba(14,110,234,0.35),
                0 60px 140px -60px rgba(0,236,129,0.25)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">Davomat darajasi · Mart–May</p>
                <p className="text-[28px] font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                  94.2<span className="text-[16px] text-slate-400">%</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-black text-emerald-700 bg-emerald-100 inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12 12 5 19 12" />
                </svg>
                +3.4%
              </span>
            </div>

            {/* SVG line chart */}
            <svg viewBox="0 0 400 140" className="w-full h-[180px]" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#03CBE7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#03CBE7" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ls1" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#03CBE7" />
                  <stop offset="50%" stopColor="#0E6EEA" />
                  <stop offset="100%" stopColor="#00EC81" />
                </linearGradient>
              </defs>
              <g stroke="#E2E8F0" strokeWidth="1">
                <line x1="0" y1="35" x2="400" y2="35" />
                <line x1="0" y1="70" x2="400" y2="70" />
                <line x1="0" y1="105" x2="400" y2="105" />
              </g>
              <path
                d="M0,90 C30,85 50,70 80,72 S130,55 160,52 S210,38 240,40 S290,30 320,22 S370,18 400,12"
                fill="none"
                stroke="url(#ls1)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M0,90 C30,85 50,70 80,72 S130,55 160,52 S210,38 240,40 S290,30 320,22 S370,18 400,12 L400,140 L0,140 Z"
                fill="url(#lg1)"
              />
              <circle cx="320" cy="22" r="5" fill="#0E6EEA" />
              <circle cx="320" cy="22" r="9" fill="#0E6EEA" opacity="0.25" />
            </svg>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">Eng faol guruh</p>
                <p className="text-[13px] font-black text-slate-900 dark:text-white mt-1">IELTS Intensive</p>
                <p className="text-[11px] text-emerald-600 font-bold tabular-nums">98.1%</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">Diqqat talab</p>
                <p className="text-[13px] font-black text-slate-900 dark:text-white mt-1">7-B Matem.</p>
                <p className="text-[11px] text-amber-600 font-bold tabular-nums">82.4%</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">O&apos;rtacha bal</p>
                <p className="text-[13px] font-black text-slate-900 dark:text-white mt-1 tabular-nums">4.32</p>
                <p className="text-[11px] text-emerald-600 font-bold">↑ +0.18</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <p
            className="text-[11px] font-black uppercase tracking-[0.22em]"
            style={{
              background: 'linear-gradient(120deg, #03CBE7 0%, #0E6EEA 50%, #00EC81 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            02 · Tahlil
          </p>
          <h2 className="mt-3 text-[36px] lg:text-[44px] leading-[1.05] font-black tracking-tight text-slate-900 dark:text-white">
            Sonlar gapiradi.<br />
            Siz to&apos;g&apos;ri qarorni qabul qilasiz.
          </h2>
          <p className="mt-5 text-[15px] lg:text-[16px] leading-relaxed text-slate-600 dark:text-slate-400 max-w-[520px]">
            Markaz, guruh, o&apos;qituvchi va o&apos;quvchi darajasidagi tahlil. Kim ortda qolmoqda, kim
            haftadan-haftaga o&apos;sayotganini bir qarashda ko&apos;rasiz.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              {
                icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
                bg: BRAND_GRAD,
                color: 'text-white',
                title: 'Real vaqt',
                desc: 'Davomat belgilangan zahoti grafiklar yangilanadi. Yakshanba kechasi hisobotni kutib o\'tirmaysiz.',
              },
              {
                icon: <><path d="M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" /><path d="M5 18l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></>,
                bg: 'linear-gradient(135deg,#DCFCE7,#A7F3D0)',
                color: 'text-emerald-700',
                title: 'AI-tavsiyalar',
                desc: '3 dars qoldirgan o\'quvchini o\'zi belgilab beradi. Sababini so\'rab xabar qoralashga yordam beradi.',
              },
              {
                icon: <><path d="M12 3v18M5 8l7-5 7 5M5 8v8l7 5 7-5V8" /></>,
                bg: 'linear-gradient(135deg,#DBEAFE,#CFFAFE)',
                color: 'text-blue-700',
                title: 'Solishtirish',
                desc: 'Guruhlar va o\'qituvchilarni bir necha mezon bo\'yicha yonma-yon ko\'ring.',
              },
            ].map(({ icon, bg, color, title, desc }) => (
              <li key={title} className="flex gap-4">
                <span
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}
                  style={{ background: bg }}
                >
                  <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </span>
                <div>
                  <p className="text-[15px] font-bold text-slate-900 dark:text-white">{title}</p>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

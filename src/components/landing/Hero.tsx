import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const MOCK_STUDENTS = [
  { name: 'Aliyev S.', init: 'AS', pattern: 'PPPLPPPPPPP.' },
  { name: 'Karimova M.', init: 'KM', pattern: 'PPPPPPPPPLP.' },
  { name: 'Rustamov J.', init: 'RJ', pattern: 'PPALPAPPPPP.' },
  { name: 'Yusupova D.', init: 'YD', pattern: 'PPPPPPPPPPP.' },
  { name: 'Saidov B.', init: 'SB', pattern: 'PPPPLPPPPAP.' },
  { name: 'Tursunova S.', init: 'TS', pattern: 'PPPPPPPLPPP.' },
  { name: 'Mirzayev O.', init: 'MO', pattern: 'PPPAPPPPPPP.' },
];

const DAY_COLUMNS = ['04', '06', '08', '11', '13', '15', '18', '20', '22', '25', '27', '29'];

const GRADIENT_BY_IDX = (i: number) =>
  i % 3 === 0
    ? 'linear-gradient(135deg,#03CBE7,#0E6EEA)'
    : i % 3 === 1
    ? 'linear-gradient(135deg,#00EC81,#03CBE7)'
    : 'linear-gradient(135deg,#0E6EEA,#0B1437)';

function dotColor(ch: string) {
  if (ch === 'P') return 'bg-emerald-500';
  if (ch === 'L') return 'bg-amber-400';
  if (ch === 'A') return 'bg-red-400';
  return 'bg-slate-200';
}

export function Hero() {
  return (
    <section
      className="relative overflow-hidden grain"
      style={{
        background: `
          radial-gradient(900px 500px at 80% -10%, rgba(3,203,231,0.18), transparent 60%),
          radial-gradient(700px 600px at 5% 10%, rgba(14,110,234,0.10), transparent 55%),
          radial-gradient(600px 500px at 50% 110%, rgba(0,236,129,0.10), transparent 60%),
          #FAFBFD`,
      }}
    >
      {/* dot grid */}
      <div
        className="absolute inset-x-0 top-0 h-[680px] opacity-50 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-16 lg:pt-24 pb-20">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">

          {/* Copy column */}
          <div className="relative z-10">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11.5px] font-bold"
              style={{ boxShadow: '0 1px 0 rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.18)' }}
            >
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px]"
                style={{ background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)' }}
              >
                YANGI
              </span>
              <span className="text-slate-700">v2 — Tahlil va AI-tavsiyalar yoqildi</span>
              <svg viewBox="0 0 24 24" className="size-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-[44px] sm:text-[54px] lg:text-[64px] leading-[1.02] font-black tracking-[-0.02em] text-slate-900">
              Ta&apos;lim markazingiz<br />
              <span
                className="inline-block"
                style={{
                  background: 'linear-gradient(120deg, #03CBE7 0%, #0E6EEA 50%, #00EC81 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                bir nuqtadan
              </span>{' '}
              boshqariladi
            </h1>

            <p className="mt-5 text-[16.5px] lg:text-[17.5px] leading-[1.55] text-slate-600 max-w-[520px]">
              Davomat, baholar, jadval, moliya va tahlil — o&apos;qituvchining qulayligi, ma&apos;muriyatning aniqligi
              bilan. <b className="text-slate-800">Bilim Nuru</b> markazingizning kunlik harakatini bitta jurnalga jamlaydi.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-white text-[14px] font-bold transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)',
                  boxShadow: '0 16px 36px -14px rgba(14,110,234,0.55)',
                }}
              >
                30 kun bepul boshlash
                <ArrowRight className="size-4" />
              </Link>
              <button className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-slate-800 text-[14px] font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors" style={{ boxShadow: '0 1px 0 rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.18)' }}>
                <span className="size-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="size-3" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
                Demoni ko&apos;rish · 2:14
              </button>
            </div>

            <p className="mt-4 text-[12px] font-semibold text-slate-500">
              Karta kerak emas · 5 daqiqada o&apos;rnatiladi · Ma&apos;lumotlar Toshkentda saqlanadi
            </p>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {[
                  { init: 'MT', bg: 'linear-gradient(135deg, #03CBE7, #0E6EEA)' },
                  { init: 'AR', bg: 'linear-gradient(135deg, #0E6EEA, #0f172a)' },
                  { init: 'KS', bg: 'linear-gradient(135deg, #00EC81, #03CBE7)' },
                ].map(({ init, bg }) => (
                  <div
                    key={init}
                    className="size-9 rounded-full ring-2 ring-white text-white text-[11px] font-black flex items-center justify-center"
                    style={{ background: bg }}
                  >
                    {init}
                  </div>
                ))}
                <div className="size-9 rounded-full ring-2 ring-white bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center">+</div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                      <path d="M12 17.3L5.8 21l1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7L18.2 21z" />
                    </svg>
                  ))}
                  <span className="text-slate-800 font-bold ml-1 text-[12px]">4.9</span>
                </div>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">240+ markaz · 4 800 o&apos;qituvchi ishonadi</p>
              </div>
            </div>
          </div>

          {/* Mockup column */}
          <div className="relative">
            {/* Floating card: attendance saved */}
            <div
              className="absolute -left-6 top-10 z-20 rounded-2xl bg-white border border-slate-200 px-3.5 py-3 w-[230px]"
              style={{
                boxShadow: '0 1px 0 rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.18)',
                animation: 'float-y 5s ease-in-out infinite',
                animationDelay: '0.4s',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="size-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)' }}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-black text-slate-900">Davomat saqlandi</p>
                  <p className="text-[10.5px] text-slate-500 font-medium">5-A · 18/18 belgilandi</p>
                </div>
              </div>
            </div>

            {/* Floating card: avg score */}
            <div
              className="absolute -right-4 bottom-16 z-20 rounded-2xl bg-white border border-slate-200 px-3.5 py-3 w-[240px]"
              style={{
                boxShadow: '0 1px 0 rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.18)',
                animation: 'float-y 5s ease-in-out infinite',
                animationDelay: '1.6s',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl flex items-center justify-center text-emerald-700" style={{ background: 'linear-gradient(135deg,#DCFCE7,#CFFAFE)' }}>
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 17 9 11 13 15 21 7" />
                    <polyline points="14 7 21 7 21 14" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-black text-slate-900">O&apos;rtacha bal: 4.32</p>
                  <p className="text-[10.5px] text-slate-500 font-medium">Haftaga nisbatan <b className="text-emerald-600">+8%</b></p>
                </div>
              </div>
            </div>

            {/* Main mockup window */}
            <div
              className="relative rounded-[22px] bg-white border border-slate-200 overflow-hidden"
              style={{
                boxShadow: `
                  0 0 0 1px rgba(15,23,42,0.06),
                  0 30px 70px -30px rgba(14,110,234,0.35),
                  0 60px 140px -60px rgba(0,236,129,0.25)`,
              }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
                <span className="size-2.5 rounded-full bg-red-400/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-3 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10.5px] font-mono text-slate-500">
                  bilimnuru.uz/jurnal/5-A
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live</span>
                </div>
              </div>

              {/* App shell */}
              <div className="flex h-[420px]">
                {/* Mini sidebar */}
                <div
                  className="w-[44px] shrink-0 py-3 flex flex-col items-center gap-2"
                  style={{ background: 'linear-gradient(180deg, #0f172a, #1e3a8a)' }}
                >
                  <div
                    className="size-8 rounded-lg flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)' }}
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.9 4.9L19 9.7l-3.8 3.4 1 5.2L12 16l-4.2 2.3 1-5.2L5 9.7l5.1-1.8z" />
                    </svg>
                  </div>
                  <div className="h-px w-6 bg-white/10 my-1" />
                  {[
                    <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
                    <><path d="M2 3h6l2 2h12v15H2z" /></>,
                    <><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" /></>,
                    <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
                  ].map((icon, i) => (
                    <span
                      key={i}
                      className={`size-7 rounded-lg flex items-center justify-center ${i === 1 ? 'text-white' : 'text-white/50'}`}
                      style={i === 1 ? { background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)' } : { background: 'rgba(255,255,255,0.06)' }}
                    >
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                    </span>
                  ))}
                </div>

                {/* Main pane */}
                <div className="flex-1 p-4 overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-3">
                    <div>
                      <p className="text-[14px] font-black text-slate-900 leading-none">5-A · Ingliz tili</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">Joriy oy: May 2026</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-slate-100">
                      <span className="px-2 py-1 rounded-md bg-white text-[10px] font-bold text-slate-700 shadow-sm">Oy</span>
                      <span className="px-2 py-1 text-[10px] font-bold text-slate-500">Hafta</span>
                    </div>
                    <span className="size-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="size-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </div>

                  {/* Journal table */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    {/* Column headers */}
                    <div className="grid text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200" style={{ gridTemplateColumns: '110px repeat(12, 1fr)' }}>
                      <div className="px-2.5 py-2">O&apos;quvchi</div>
                      {DAY_COLUMNS.map((d, i) => (
                        <div key={d} className={`px-1 py-2 text-center ${i === 11 ? 'text-slate-400' : ''}`}>{d}</div>
                      ))}
                    </div>

                    {/* Rows */}
                    {MOCK_STUDENTS.map((s, idx) => (
                      <div
                        key={s.init}
                        className="grid border-b border-slate-100 last:border-b-0 items-center hover:bg-slate-50/60 transition-colors"
                        style={{ gridTemplateColumns: '110px repeat(12, 1fr)' }}
                      >
                        <div className="px-2.5 py-2 flex items-center gap-2 min-w-0">
                          <span
                            className="size-6 shrink-0 rounded-md text-white text-[9px] font-black flex items-center justify-center"
                            style={{ background: GRADIENT_BY_IDX(idx) }}
                          >
                            {s.init}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-800 truncate">{s.name}</span>
                        </div>
                        {s.pattern.split('').map((ch, ci) => (
                          <div key={ci} className="py-2 flex items-center justify-center">
                            <span className={`size-2.5 rounded-full ${dotColor(ch)}`} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-emerald-500" />Keldi</span>
                    <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-amber-400" />Kech qoldi</span>
                    <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-red-400" />Kelmadi</span>
                    <span className="ml-auto font-mono text-[10px] text-slate-400">avtomatik saqlanmoqda…</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient gradient behind mockup */}
            <div
              className="absolute -z-10 -inset-8 opacity-[0.18] rounded-[40px] blur-3xl"
              style={{ background: 'linear-gradient(135deg, #03CBE7 0%, #0E6EEA 55%, #00EC81 110%)' }}
            />
          </div>
        </div>
      </div>

      {/* Logo strip */}
      <div className="relative border-t border-slate-200/70 bg-white/60 backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 flex items-center gap-6">
          <p className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-500 shrink-0 hidden md:block">
            O&apos;zbekistondagi 240+ ta&apos;lim markazi ishonadi
          </p>
          <div
            className="flex-1 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
            }}
          >
            <div className="flex items-center gap-12 whitespace-nowrap w-max" style={{ animation: 'slide-x 38s linear infinite' }}>
              {[
                'EduTech Toshkent', 'Bilim Maskani', 'IELTS PRO ·', 'Najot Ta\'lim',
                'PDP Academy', 'Smart Kids', 'Buxoro Edu', 'Andijon IT',
                'EduTech Toshkent', 'Bilim Maskani', 'IELTS PRO ·', 'Najot Ta\'lim',
                'PDP Academy', 'Smart Kids', 'Buxoro Edu', 'Andijon IT',
              ].map((name, i) => (
                <span key={i} className="text-[18px] font-black tracking-tight text-slate-400">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

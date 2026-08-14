# Bilim Nuru — agent uchun qo'llanma

Ta'lim markazi CRM/LMS. Next.js 16 (App Router) + Tailwind v4 + TanStack Query.
Backend alohida NestJS xizmati, bu repoda emas.

`CLAUDE.md` shu faylni yuklaydi.

---

## Buyruqlar

```bash
npm run dev            # turbopack
npm run build          # tsc + next build — PR oldidan majburiy
npm run lint
npm run design:audit   # dizayn token qoidalari (pastga qarang)
npm run test:e2e       # playwright
```

---

## Dizayn tizimi

To'liq hujjat: `docs/DESIGN_SYSTEM.md`. Qisqacha qoida — **hech qanday xom
qiymat yozilmaydi**:

- Shrift bitta: Inter. Sahifaga xos shrift yo'q.
- O'lcham `text-h1…text-h4`, `text-body`, `text-body-sm`, `text-caption` dan
  olinadi (`text-display` — faqat hero, mahsulot ichida ishlatilmaydi).
  Tailwind'ning o'z shkalasi (`text-sm`, `text-xs`, `text-2xl`…) ham taqiqlangan —
  `design:audit` ularni ushlaydi. Shkala o'z `font-weight` ini olib keladi — ustiga qo'shmang.
  `text-[13px]` kabi ixtiyoriy o'lchamlar yo'q.
- Rang faqat semantik tokenlardan: `bg-card`, `text-foreground`,
  `text-muted-foreground`, `border-border`, `bg-primary`, `text-success-emphasis`
  va h.k. `bg-slate-800`, `text-gray-500`, `#1e293b` — yo'q.
- Radius ikkita: `rounded-card` (karta, panel), `rounded-control` (tugma, badge,
  input). Soya ikkita: `shadow-card`, `shadow-card-hover`.
- UI `src/components/ui/` dan quriladi: `PageHeader`, `Button`, `Card`, `Badge`,
  `StatCard`, `Table`, `Input`… Yangi sahifa uchun yangi tugma yasamang.

`npm run design:audit` shu qoidalarni tekshiradi va buzilganda **yiqiladi**.
Istisnolar `scripts/design-audit.mjs` ichida `HEX_ALLOWED` da izohi bilan
yozilgan (masalan `global-error.tsx` — u CSS yuklanmaganda ishlaydi).

### Ikkita tuzoq

1. **`dark:` varianti.** Tailwind v4 sukut bo'yicha `prefers-color-scheme` ga
   bog'laydi, lekin `next-themes` klass qo'yadi. `globals.css` dagi
   `@custom-variant dark (&:where(.dark, .dark *))` shuni bog'laydi — o'chirsangiz
   butun mahsulot light rejimda qotib qoladi.
2. **`tailwind-merge`.** Maxsus klass guruhlari (`text-h1`, `rounded-card`,
   `shadow-card`) `src/lib/utils.ts` da `extendTailwindMerge` orqali
   ro'yxatdan o'tgan. Ro'yxatga qo'shmasdan yangi token guruhini qo'shsangiz,
   `cn()` uni jimgina yeb qo'yadi — tugmalar rangini yo'qotadi va build
   muvaffaqiyatli o'tadi.

### Grafiklar

Recharts `fill`/`stroke` ni SVG **prezentatsiya atributi** sifatida yozadi, u
yerda CSS `var()` ishlamaydi. Grafik ranglari `src/lib/chart-theme.ts` dan
(`useChartTheme`, `seriesColor`) hex ko'rinishida olinadi.

---

## Auth va xavfsizlik

- **Sessiya** — HttpOnly cookie'dagi HS256 JWT. Sozlamalar
  `src/lib/auth/token-config.ts` da.
- **Middleware** (`src/middleware.ts`) marshrutlarni himoyalaydi va
  `/api/proxy/*` ni backendga rewrite qiladi. `/api/proxy/*` uchun alohida route
  handler **yo'q va kerak emas** — middleware har doim oldin ushlaydi.
- **Nuqta bo'lgan yo'l static fayl degani emas.** `pathname.includes('.')` va
  matcher'dagi `.*\.(svg|png|…)$` — ikkalasi ham auth bypass bo'lgan, chunki
  `[id]` segmenti `42.png` ga ham mos keladi. Faqat bitta segmentli
  `ROOT_STATIC_ASSET` regexi ishlatiladi. Kengaytmaga qarab istisno qo'shmang.
- **Route handler o'z auth'ini o'zi tekshiradi.** Middleware faqat cookie
  *borligini* ko'radi, imzosini emas. Pul sarflaydigan yoki yozadigan route
  `getServerSession()` (`src/lib/auth/server-session.ts`) ni chaqirishi shart.
- **`/api/*` hech qachon redirect qilinmaydi** — 401/403 JSON qaytaradi.
  `fetch()` redirect'ga ergashadi, natijada rad etilgan chaqiruv login
  sahifasining 200'ini olib, muvaffaqiyat bo'lib o'qiladi.
- **Sirlar doimiy vaqtda solishtiriladi** — `isValidAdminSecret()`
  (`src/lib/auth/admin-secret.ts`). `!==` birinchi farqda to'xtaydi va sirni
  bayt-bayt ochib beradi.

### AI copilot

Model **endpoint nomlamaydi**. U *action* nomini aytadi, action → path/method/schema
xaritasi `src/lib/ai/actions.ts` da, serverda turadi. `POST /api/ai/actions`
nomni ro'yxatdan topadi, payload'ni **qayta** tekshiradi va shundan keyin
backendga boradi.

Tool natijasiga `confirmUrl` / `confirmMethod` **qo'shmang** — brauzerga qaysi
URL'ni chaqirishni aytish aynan tuzatilgan xato.

Client'dan kelgan xabarlarda `system` roli qabul qilinmaydi
(`src/lib/ai/normalize-messages.ts`) — aks holda foydalanuvchi o'z system
prompt'ini qo'shib olardi.

---

## Workflow'lar

`src/workflows/` — Vercel Workflow SDK.

Bitta qoida hammasidan muhim: **bitta step = bitta yon ta'sir.** Step qayta
ijro etilganda ichidagi hamma narsa qaytadan bajariladi. 100 ta WhatsApp
xabarini bitta stepga solsangiz, 60-chisida yiqilish 60 ta ota-onaga takroriy
qarz eslatmasini yuboradi.

Xatolarni assimetrik ko'ring: aniq yetkazilmagan (429, 5xx) → `RetryableError`;
aniq rad etilgan (boshqa 4xx) → dead letter; **noaniq transport xatosi → retry
QILINMAYDI**, chunki xabar allaqachon ketgan bo'lishi mumkin.

Jadval workflow ichida emas, tashqarida: `while (true) … sleep('24h')` o'rniga
cron → `POST /api/workflows/payment-reminder`.

---

## Testlar

`tests/e2e/` — Playwright. `request` fixture'idan foydalanadiganlari brauzersiz
va backendsiz ishlaydi; `page` ishlatadiganlari uchun tirik backend kerak.

- `auth-route-protection.spec.ts` — bypass regressiyasi
- `ai-actions.spec.ts` — action allowlist
- `ai-rate-limit.spec.ts` — auth + rate limit
- `design-tokens.spec.ts` — hisoblangan kontrast (ikkala mavzuda)

Ikki odat:

1. **Testning tishi borligini isbotlang.** Tuzatishni vaqtincha orqaga qaytarib,
   testning yiqilishini ko'ring. Server portda qotib qolmaganiga ishonch hosil
   qiling — eskirgan server "o'tdi" deb yolg'on aytadi.
2. **Qayta ishga tushirilganda ham o'tsin.** Rate limit hisoblagichlari server
   process'ida yashaydi. Testlar har safar yangi `sub` generatsiya qiladi, aks
   holda spec bir marta o'tib, ikkinchi run'da yiqiladi.

---

## Ma'lum kamchiliklar

Yashirilmagan, kodda ham izohlangan:

- **Rate limit process xotirasida.** Serverless'da haqiqiy shift
  `chegara × instance soni`. Bu xarajat tormozi, kirish nazorati emas — haqiqiy
  yechim umumiy saqlash (Redis).
- **To'lov eslatmalarida run'lar aro takror.** Run ichida checkpoint bor, lekin
  "invoice X ga Y kuni yuborilgan" degan doimiy yozuv yo'q. Cron kuniga bir
  marta ishlashi kerak.
- **JWT HS256 umumiy sir bilan.** Front-end backend'ning imzolash sirini biladi.
  RS256 + JWKS to'g'ri yechim, lekin backend o'zgarishini talab qiladi.

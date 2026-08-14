#!/usr/bin/env node
/**
 * Design-system drift guard.
 *
 * Every colour, radius, elevation and type size in the app is supposed to
 * come from a token (see docs/DESIGN_SYSTEM.md). This walks the source and
 * reports the ways a page can still invent its own look.
 *
 * The public landing page is excluded — it is a marketing surface, not part
 * of the CRM design system.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/app', 'src/components', 'src/lib'];
const EXCLUDE = ['src/components/landing', 'src/lib/chart-theme.ts'];

/**
 * Files that legitimately cannot reach a CSS variable, with the reason.
 * Anything not on this list has to use a token.
 */
const HEX_ALLOWED = new Map([
  ['src/app/global-error.tsx', 'renders its own <html>, outside the stylesheet'],
  ['src/app/layout.tsx', 'themeColor metadata must be a literal colour'],
  ['src/app/opengraph-image.tsx', 'satori edge rendering has no CSS variables'],
  ['src/components/finance/Receipt.tsx', 'printed/PDF receipt needs fixed print colours'],
  ['src/lib/receipt/pdf.ts', 'html2canvas needs a literal page background'],
]);

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|' +
  'teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const RULES = [
  {
    id: 'raw-palette',
    label: 'Raw Tailwind palette class (use a token or a Tone)',
    re: new RegExp(
      `\\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via|fill|stroke|divide)-(?:${PALETTE})-(?:50|100|200|300|400|500|600|700|800|900|950)\\b`,
      'g',
    ),
  },
  {
    id: 'hex-colour',
    label: 'Hard-coded hex colour (use a token, or chart-theme for charts)',
    re: /#[0-9A-Fa-f]{6}\b/g,
    // globals.css *defines* the tokens; that is where the hexes belong.
    skip: (file) => file.endsWith('globals.css') || HEX_ALLOWED.has(file),
  },
  {
    id: 'arbitrary-type',
    label: 'Arbitrary font size (use the text-h1..caption scale)',
    re: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g,
  },
  {
    // The rule above only ever caught text-[13px]. Tailwind's own scale is the
    // far more common way to drift: text-sm and text-xs alone accounted for
    // 433 of the 521 sites this rule was written to clear. Stock sizes carry
    // no weight and no line-height opinion, so every use re-decides the
    // product's typography in a slightly different way.
    id: 'stock-type-scale',
    label: "Tailwind's own font size (use the text-h1..caption scale)",
    re: /(?<![\w-])(?:[a-z0-9][\w-]*:|\*\*:|\[[^\]]*\]:)*text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)(?![\w-])/g,
  },
  {
    id: 'weight-override',
    label: 'Weight override (the type scale carries its own weight)',
    re: /\bfont-(?:black|extrabold)\b/g,
  },
  {
    id: 'arbitrary-radius',
    label: 'Arbitrary radius (use rounded-card or rounded-control)',
    re: /\brounded-\[(?!2px\])[^\]]+\]/g,
  },
  {
    id: 'arbitrary-shadow',
    label: 'Arbitrary shadow (use shadow-card or shadow-card-hover)',
    re: /\bshadow-\[[^\]]+\]/g,
  },
  {
    id: 'page-font',
    label: 'Page-specific font family (the product has one family)',
    re: /\bfont-(?:serif|mono)\b|font-family:\s*(?!var\(--font-sans\))/g,
    skip: (file) => file.endsWith('globals.css'),
  },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (EXCLUDE.some((x) => p.startsWith(x))) continue;
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx|ts|css)$/.test(p)) yield p;
  }
}

const findings = new Map();
let total = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, 'utf8');
    src.split('\n').forEach((line, i) => {
      for (const rule of RULES) {
        if (rule.skip?.(file)) continue;
        rule.re.lastIndex = 0;
        const hits = line.match(rule.re);
        if (!hits) continue;
        if (!findings.has(rule.id)) findings.set(rule.id, []);
        findings.get(rule.id).push({
          file: relative(process.cwd(), file),
          line: i + 1,
          hits: [...new Set(hits)].join(', '),
        });
        total += hits.length;
      }
    });
  }
}

if (total === 0) {
  console.log('design:audit — clean. Every value comes from a token.');
  process.exit(0);
}

for (const rule of RULES) {
  const rows = findings.get(rule.id);
  if (!rows?.length) continue;
  console.log(`\n${rule.label}  (${rows.length})`);
  for (const r of rows.slice(0, 20)) {
    console.log(`  ${r.file}:${r.line}  ${r.hits}`);
  }
  if (rows.length > 20) console.log(`  … and ${rows.length - 20} more`);
}

console.log(`\n${total} value(s) outside the design system.`);
process.exit(1);

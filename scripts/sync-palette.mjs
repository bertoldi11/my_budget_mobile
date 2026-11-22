#!/usr/bin/env node
/**
 * Gera `src/constants/palette.ts` a partir da paleta daisyUI do projeto web
 * (`my_budget/assets/css/app.css`), que é a fonte da verdade.
 *
 * As cores dos temas estão em OKLCH, que o React Native não sabe parsear
 * (`@react-native/normalize-colors` aceita hex/rgb/hsl/hwb), então aqui elas são
 * convertidas para hex sRGB usando a conversão do CSS Color 4, com gamut mapping
 * por redução de croma quando a cor cai fora do sRGB.
 *
 * Uso: node scripts/sync-palette.mjs [caminho/para/my_budget]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const webRoot = resolve(projectRoot, process.argv[2] ?? process.env.MY_BUDGET_PATH ?? '../my_budget');
const cssPath = resolve(webRoot, 'assets/css/app.css');
const outPath = resolve(projectRoot, 'src/constants/palette.ts');

/* ---------- conversão de cor ---------- */

const clamp01 = (x) => Math.min(1, Math.max(0, x));

function oklchToOklab(L, C, H) {
  const h = (H * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearSrgbToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

// transferência sRGB (gamma)
const encode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const inGamut = ([r, g, b]) => [r, g, b].every((c) => c >= -1e-4 && c <= 1 + 1e-4);

function deltaEOK(lab1, lab2) {
  return Math.hypot(lab1[0] - lab2[0], lab1[1] - lab2[1], lab1[2] - lab2[2]);
}

/**
 * Gamut mapping do CSS Color 4: mantém L e H, busca o maior croma cujo
 * resultado recortado fique dentro de 0.02 de deltaEOK da cor original.
 */
function oklchToHex(L, C, H) {
  let linear = oklabToLinearSrgb(...oklchToOklab(L, C, H));

  if (!inGamut(linear)) {
    if (L >= 1) linear = [1, 1, 1];
    else if (L <= 0) linear = [0, 0, 0];
    else {
      let lo = 0;
      let hi = C;
      const JND = 0.02;
      for (let i = 0; i < 40 && hi - lo > 1e-6; i++) {
        const mid = (lo + hi) / 2;
        const candidate = oklabToLinearSrgb(...oklchToOklab(L, mid, H));
        if (inGamut(candidate)) {
          lo = mid;
          continue;
        }
        const clipped = candidate.map(clamp01);
        const error = deltaEOK(linearSrgbToOklab(...clipped), linearSrgbToOklab(...candidate));
        if (error < JND) lo = mid;
        else hi = mid;
      }
      linear = oklabToLinearSrgb(...oklchToOklab(L, lo, H)).map(clamp01);
    }
  }

  const hex = linear
    .map(clamp01)
    .map((c) => Math.round(clamp01(encode(c)) * 255))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

function cssColorToHex(value, token) {
  const raw = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();

  const oklch = raw.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/i
  );
  if (!oklch) throw new Error(`Cor não suportada em "${token}": ${raw}`);

  const [, lRaw, pct, cRaw, hRaw] = oklch;
  const L = pct ? Number(lRaw) / 100 : Number(lRaw);
  return oklchToHex(L, Number(cRaw), Number(hRaw));
}

/* ---------- parsing do app.css ---------- */

const css = readFileSync(cssPath, 'utf8');

function parseThemes() {
  const themes = {};
  const blocks = css.matchAll(
    /@plugin\s+"[^"]*daisyui-theme"\s*\{([^}]*)\}/g
  );
  for (const [, body] of blocks) {
    const name = body.match(/name:\s*"([^"]+)"/)?.[1];
    if (!name) continue;
    const colors = {};
    for (const [, token, value] of body.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
      colors[token] = cssColorToHex(value, `--color-${token}`);
    }
    themes[name] = colors;
  }
  return themes;
}

function parseChartSeries() {
  // claro: bloco `:root {`; escuro: bloco `:root[data-theme="dark"] {`
  const grab = (startRe) => {
    const start = css.search(startRe);
    if (start === -1) return null;
    const open = css.indexOf('{', start);
    const close = css.indexOf('}', open);
    const body = css.slice(open + 1, close);
    const series = {};
    for (const [, slot, value] of body.matchAll(/--chart-series-([a-z0-9]+):\s*([^;]+);/g)) {
      series[slot] = cssColorToHex(value, `--chart-series-${slot}`);
    }
    return Object.keys(series).length ? series : null;
  };

  const light = grab(/:root\s*\{(?=[^}]*--chart-series)/);
  const dark = grab(/:root\[data-theme="dark"\]\s*\{/);
  if (!light || !dark) throw new Error('Não encontrei os blocos de --chart-series no app.css');
  return { light, dark };
}

const themes = parseThemes();
const chart = parseChartSeries();

for (const name of ['light', 'dark']) {
  if (!themes[name]) throw new Error(`Tema "${name}" não encontrado no app.css`);
}

/* ---------- geração do TS ---------- */

const camel = (token) => token.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

// ordem estável para o diff ficar legível
const TOKEN_ORDER = [
  'base-100', 'base-200', 'base-300', 'base-content',
  'primary', 'primary-content',
  'secondary', 'secondary-content',
  'accent', 'accent-content',
  'neutral', 'neutral-content',
  'info', 'info-content',
  'success', 'success-content',
  'warning', 'warning-content',
  'error', 'error-content',
];

function renderTheme(name) {
  const colors = themes[name];
  const known = TOKEN_ORDER.filter((t) => t in colors);
  const extra = Object.keys(colors).filter((t) => !TOKEN_ORDER.includes(t)).sort();
  return [...known, ...extra]
    .map((token) => `    ${camel(token)}: '${colors[token]}',`)
    .join('\n');
}

function renderSeries(scheme) {
  const series = chart[scheme];
  const numbered = Object.keys(series)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));
  const list = numbered.map((k) => `      '${series[k]}',`).join('\n');
  return `    series: [\n${list}\n    ],\n    other: '${series.other}',`;
}

const banner = `/**
 * GERADO AUTOMATICAMENTE — não edite à mão.
 *
 * Fonte: ../my_budget/assets/css/app.css (temas daisyUI + cores de gráfico).
 * Regenere com: npm run sync:palette
 *
 * Os valores OKLCH do CSS foram convertidos para hex sRGB porque o React Native
 * não parseia oklch(). O mapeamento para nomes semânticos do app está em
 * ./theme.ts — altere lá, não aqui.
 */`;

const out = `${banner}

export const Palette = {
  light: {
${renderTheme('light')}
  },
  dark: {
${renderTheme('dark')}
  },
} as const;

/** Cores categóricas de gráfico. A ordem é fixa: cada slot é sempre a mesma cor. */
export const ChartColors = {
  light: {
${renderSeries('light')}
  },
  dark: {
${renderSeries('dark')}
  },
} as const;

export type PaletteColor = keyof typeof Palette.light & keyof typeof Palette.dark;
`;

writeFileSync(outPath, out);
console.log(`✔ ${outPath}`);
console.log(`  fonte: ${cssPath}`);
for (const scheme of ['light', 'dark']) {
  console.log(`  ${scheme}: ${Object.keys(themes[scheme]).length} tokens, ${Object.keys(chart[scheme]).length} cores de gráfico`);
}

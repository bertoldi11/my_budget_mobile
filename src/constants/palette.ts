/**
 * GERADO AUTOMATICAMENTE — não edite à mão.
 *
 * Fonte: ../my_budget/assets/css/app.css (temas daisyUI + cores de gráfico).
 * Regenere com: npm run sync:palette
 *
 * Os valores OKLCH do CSS foram convertidos para hex sRGB porque o React Native
 * não parseia oklch(). O mapeamento para nomes semânticos do app está em
 * ./theme.ts — altere lá, não aqui.
 */

export const Palette = {
  light: {
    base100: '#f7fbf8',
    base200: '#edf4ee',
    base300: '#dee8df',
    baseContent: '#122115',
    primary: '#1d7d3e',
    primaryContent: '#f0fdf1',
    secondary: '#536a57',
    secondaryContent: '#f4faf5',
    accent: '#009775',
    accentContent: '#ecfdf6',
    neutral: '#354437',
    neutralContent: '#f4faf5',
    info: '#008fdb',
    infoContent: '#edf7fd',
    success: '#2e9e52',
    successContent: '#f0fdf1',
    warning: '#df6f00',
    warningContent: '#fdf9e8',
    error: '#e9003e',
    errorContent: '#fceeef',
  },
  dark: {
    base100: '#202921',
    base200: '#171f18',
    base300: '#0f1610',
    baseContent: '#e6f3e8',
    primary: '#40a35c',
    primaryContent: '#0c1a0f',
    secondary: '#618568',
    secondaryContent: '#f4faf5',
    accent: '#3bb693',
    accentContent: '#061a14',
    neutral: '#3c4c3f',
    neutralContent: '#f4faf5',
    info: '#0099e0',
    infoContent: '#edf7fd',
    success: '#45b164',
    successContent: '#0c1a0f',
    warning: '#df6f00',
    warningContent: '#fdf9e8',
    error: '#e9003e',
    errorContent: '#fceeef',
  },
} as const;

/** Cores categóricas de gráfico. A ordem é fixa: cada slot é sempre a mesma cor. */
export const ChartColors = {
  light: {
    series: [
      '#2a78d6',
      '#eb6834',
      '#1baf7a',
      '#eda100',
      '#e87ba4',
      '#008300',
      '#6250d6',
    ],
    other: '#8c8c87',
  },
  dark: {
    series: [
      '#3987e5',
      '#d95926',
      '#199e70',
      '#c98500',
      '#d55181',
      '#0ca30c',
      '#9085e9',
    ],
    other: '#85857f',
  },
} as const;

export type PaletteColor = keyof typeof Palette.light & keyof typeof Palette.dark;

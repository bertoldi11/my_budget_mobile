/**
 * Tema do app. As cores vêm de `./palette.ts`, gerado a partir da paleta
 * daisyUI do projeto web (../my_budget) — a fonte da verdade das duas pontas.
 * Para mudar uma cor, mude lá e rode `npm run sync:palette`.
 *
 * Aqui ficam só os apelidos semânticos usados pelos componentes do app.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { ChartColors, Palette } from '@/constants/palette';

/**
 * Equivalente ao `text-base-content/60` do web: 60% de opacidade (0x99 = 153/255)
 * sobre qualquer superfície.
 */
const muted = (hex: string) => `${hex}99`;

function theme<T extends Record<string, string>>(palette: T) {
  return {
    ...palette,
    /** base-100: fundo da tela */
    background: palette.base100,
    /** base-200: cartões, barras, campos */
    backgroundElement: palette.base200,
    /** base-300: estado selecionado e bordas */
    backgroundSelected: palette.base300,
    border: palette.base300,
    text: palette.baseContent,
    textSecondary: muted(palette.baseContent),
  } as const;
}

export const Colors = {
  light: theme(Palette.light),
  dark: theme(Palette.dark),
} as const;

export { ChartColors };

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

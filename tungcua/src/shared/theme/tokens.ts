export const themeTokens = {
  colors: {
    bg: { base: 'bg-base', alt: 'bg-alt' },
    mint: { surface: 'mint-surface', primary: 'mint-primary', ink: 'mint-ink' },
    pink: { surface: 'pink-surface', primary: 'pink-primary', ink: 'pink-ink' },
    lowConfidenceUnderline: 'pink-ink',
  },
  fontFamily: {
    sans: 'font-sans',
    rounded: 'font-rounded',
  },
} as const;

export type ThemeTokens = typeof themeTokens;

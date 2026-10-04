# Contract: Theme Tokens (Tailwind + NativeWind)

**Feature**: `003-cross-platform-foundation` | **Date**: 2026-10-04

## Single Source of Truth

`tailwind.config.js` at repo root defines all design tokens. Views use **only** `className` with these tokens. No hardcoded hex values in any view file.

## Token Definitions (from PROJECT_SCOPE.md)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode (default)
        bg: {
          base: '#F6FBF8',   // mint-white
          alt: '#FDF5F9',    // pink-white
        },
        mint: {
          surface: '#DDF6E8',
          primary: '#7ED6B5',
          primaryPressed: '#4FBF9A',
          ink: '#0E4A38',
        },
        pink: {
          surface: '#FBDCE9',
          primary: '#E893BE',
          primaryPressed: '#CC6DA0',
          ink: '#5E2144',
        },
        // Dark mode (via .dark class on root)
        dark: {
          bg: {
            base: '#0F1F1A',
            alt: '#0F1F1A',
          },
          mint: {
            surface: '#1B3A30',
            primary: '#7ED6B5',
            primaryPressed: '#4FBF9A',
            ink: '#DDF6E8',
          },
          pink: {
            surface: '#3A2433',
            primary: '#E893BE',
            primaryPressed: '#CC6DA0',
            ink: '#FBDCE9',
          },
        },
        // Semantic aliases
        lowConfidenceUnderline: 'pink.ink',
        tappedSurface: 'mint.surface',
        tappedInk: 'mint.ink',
        savedSurface: 'pink.surface',
        savedInk: 'pink.ink',
      },
      fontFamily: {
        // Noto Sans SC for Chinese, Noto Sans Rounded for Latin (both OFL)
        sans: ['NotoSansSC', 'NotoSansRounded', 'system-ui'],
        // Hero/rounded: Noto Sans Rounded
        rounded: ['NotoSansRounded', 'system-ui'],
      },
    },
  },
};
```

## Usage in Views

```tsx
// ✅ Correct: token-only
<View className="bg-bg-base dark:bg-dark-bg-base">
  <Text className="text-mint-ink dark:text-dark-mint-ink font-sans">
    Recognized text
  </Text>
  <View className="bg-mint-surface dark:bg-dark-mint-surface" />
</View>

// ❌ Forbidden: hardcoded hex
<View style={{ backgroundColor: '#F6FBF8' }} />
<Text style={{ color: '#0E4A38' }} />
```

## Rules (Constitution L123-125)

1. **Pastels are surfaces only, never body text**. Body text uses `ink` colors.
2. **Tapped character** → `tappedSurface` + `tappedInk` (mint family).
3. **Saved character** → `savedSurface` + `savedInk` (pink family).
4. **Low-confidence underline** → `lowConfidenceUnderline` (pink.ink). Never red.
5. **Dark mode**: toggled by `class` strategy on root view (`<View className={isDark ? 'dark' : ''}>`).
6. **Fonts**: `font-sans` for body (Noto Sans SC + Rounded), `font-rounded` for hero character (P1+).

## Re-export for TypeScript

```typescript
// src/shared/theme/tokens.ts
// Re-exports token names for type-safe usage in hooks/components
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
```
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
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
  plugins: [],
}
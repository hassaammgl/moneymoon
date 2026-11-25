const { colors, fonts } = require('./src/theme/palette');

/**
 * Moneymoon design tokens (v2) as Tailwind utilities.
 *
 * Every colour and font family comes from `src/theme/palette.js`, so className
 * and runtime styles can never drift apart. Spacing uses Tailwind's default
 * 4px scale. Type sizes below are the design-system scale; `Money` in step 4
 * takes its sizes as props.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      fontFamily: fonts,
      fontSize: {
        /** Hero balance — 46. */
        'amount-hero': [46, { lineHeight: 52, letterSpacing: -1 }],
        /** Large amount — 22. */
        'amount-lg': [22, { lineHeight: 28, letterSpacing: -0.4 }],
        /** Card amount — 20. */
        'amount-md': [20, { lineHeight: 26, letterSpacing: -0.3 }],
        /** Small amount — 15. */
        'amount-sm': [15, { lineHeight: 20 }],
        /** Screen heading — 24. */
        h1: [24, { lineHeight: 30, letterSpacing: -0.5 }],
        /** Section heading — 18. */
        h2: [18, { lineHeight: 24, letterSpacing: -0.2 }],
        /** Body — 14/20. */
        body: [14, { lineHeight: 20 }],
        /** Small body — 12/16. */
        'body-sm': [12, { lineHeight: 16 }],
        /** Micro label — 11/14. */
        label: [11, { lineHeight: 14, letterSpacing: 0.2 }],
        /** Pill label — 13/18. */
        'label-lg': [13, { lineHeight: 18 }],
      },
      borderRadius: {
        card: 24,
        sheet: 28,
      },
      minHeight: {
        tap: 44,
      },
      minWidth: {
        tap: 44,
      },
      height: {
        tap: 44,
      },
      width: {
        tap: 44,
      },
      maxWidth: {
        content: 680,
      },
    },
  },
  plugins: [],
};

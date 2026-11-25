/**
 * Moneymoon design tokens (v2).
 *
 * Single source of truth for colour and type. Plain CommonJS so
 * `tailwind.config.js` can require it without a build step, and
 * `src/theme/index.ts` re-exports it with types for the places `className`
 * cannot reach (icon `color` props, SVG strokes, progress fills).
 *
 * Rules baked into the palette:
 * - emerald means "healthy budget" only
 * - rose means "couple" and "Her Kharcha" only
 * - cards are white with a 1px line border; no gradients, no heavy shadows
 *
 * Light mode only. To add dark mode later, wrap these in `{ light, dark }` and
 * have `useTheme()` pick one.
 */

/** v2 palette — the only tokens new UI may use. */
const v2 = {
  // Surfaces
  canvas: '#FBF7F4',
  surface: '#FFFFFF',
  line: '#F0E6E2',
  track: '#F1E7E3',
  'chip-border': '#E7DAD5',

  // Text
  ink: '#2A1F24',
  'ink-muted': '#6B5B62',

  // Hero card
  plum: '#3A1D2A',
  cream: '#FFF1EC',
  'cream-muted': '#E8CDD3',

  // Emerald — healthy budget
  emerald: '#10B981',
  'emerald-ink': '#047857',
  'emerald-soft': '#E6F6EF',
  'mint-on-dark': '#34D399',
  'mint-on-dark-soft': '#6EE7B7',

  // Rose — couple identity and Her Kharcha
  rose: '#E11D48',
  'rose-ink': '#9F1239',
  'rose-ink-2': '#BE123C',
  'rose-soft': '#FFE4E9',
  'rose-line': '#FDA4AF',
  'heart-on-dark': '#FB7185',
};

/**
 * Legacy tone tokens.
 *
 * `src/constants/envelopes.ts` is frozen by the brief and still reads these
 * names through `ThemeColors` (`toneStyle`, `toneSurfaceClass`). They stay so
 * that file keeps compiling untouched. New UI must not use them — everything
 * above supersedes them, and shared names resolve to the v2 value.
 */
const legacy = {
  muted: '#F2F3FF',
  sunken: '#F8FAFC',
  'line-soft': '#F1F5F9',

  'ink-strong': '#0F172A',
  'ink-2': '#3C4A42',
  slate: '#64748B',
  'slate-mid': '#475569',
  'slate-dark': '#334155',
  'slate-light': '#94A3B8',

  primary: '#006C49',
  'primary-deep': '#00422B',
  'on-primary': '#FFFFFF',
  accent: '#10B981',
  'accent-deep': '#059669',
  'accent-deeper': '#047857',
  'accent-ink': '#064E3B',
  'accent-ink-deep': '#065F46',
  mint: '#6FFBBE',
  'mint-ink': '#002113',
  'mint-soft': 'rgba(111, 251, 190, 0.40)',
  'emerald-soft-strong': 'rgba(78, 222, 163, 0.40)',
  'mint-wash': '#ECFDF5',
  'mint-line': '#A7F3D0',
  'mint-line-strong': '#6EE7B7',
  'mint-line-soft': '#D1FAE5',
  'brand-soft': 'rgba(16, 185, 129, 0.20)',

  'rose-wash': '#FFF1F2',
  'rose-ink-deep': '#40000D',
  'rose-accent': '#E11D48',

  amber: '#FFDDB8',
  'amber-soft': 'rgba(255, 221, 184, 0.30)',
  'amber-soft-strong': 'rgba(255, 221, 184, 0.40)',
  'amber-soft-badge': 'rgba(255, 221, 184, 0.60)',
  'amber-wash': '#FFFBEB',
  'amber-ink': '#855300',
  'amber-ink-deep': '#653E00',
  'amber-accent': '#E29100',
  'amber-accent-deep': '#D97706',

  lilac: '#E2E7FF',
  'lilac-deep': '#DAE2FD',
  'indigo-soft': '#E0E7FF',
  'indigo-ink': '#4338CA',

  scrim: 'rgba(250, 248, 255, 0.80)',
  'scrim-strong': 'rgba(250, 248, 255, 0.85)',
  'sheet-backdrop': 'rgba(2, 6, 23, 0.40)',
};

const colors = { ...legacy, ...v2 };

/**
 * Font family names registered with expo-font (see `fontAssets` in
 * `src/theme/index.ts`). One static file per weight:
 * Fraunces 600 for amounts and headings, DM Sans 400/500/600 for body.
 */
const fonts = {
  display: 'Fraunces_600SemiBold',
  sans: 'DMSans_400Regular',
  'sans-medium': 'DMSans_500Medium',
  'sans-semibold': 'DMSans_600SemiBold',
};

module.exports = { colors, fonts };

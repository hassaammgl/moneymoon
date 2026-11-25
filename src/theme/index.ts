/**
 * Runtime theme values.
 *
 * Styling lives in `tailwind.config.js` + `src/theme/palette.js` (className
 * utilities). This file exposes the same tokens to JavaScript for the places
 * className cannot reach: icon `color` props, SVG strokes, progress-bar fills
 * and the fonts handed to `useFonts`.
 *
 * Light mode only for now.
 */

import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';

import { colors, fonts } from './palette';

export { colors, fonts };

/** Font files handed to `useFonts`. One static file per weight. */
export const fontAssets = {
  Fraunces_600SemiBold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} as const;

export type ThemeColors = typeof colors;

/**
 * Fixed layout numbers that className cannot express — screen-edge padding used
 * in inline `contentContainerStyle`, and the space the nav reserves.
 */
export const layout = {
  /** Screen gutter — 24 on every edge. */
  screenX: 24,
  /** Legacy — only the not-yet-rebuilt dashboard reads these two. */
  headerHeight: 64,
  headerGap: 4,
  /** Bottom bar height — 80, before the safe-area inset. */
  navHeight: 80,
  /** Space reserved at the bottom of a scrolling screen for the nav — 112. */
  scrollBottomInset: 112,
  /** Minimum touch target. */
  minTap: 44,
  /** Content cap so the layout stays readable on tablets and web. */
  maxWidth: 680,
} as const;

export interface Theme {
  colors: ThemeColors;
  fonts: typeof fonts;
}

const light: Theme = { colors, fonts };

export function useTheme(): Theme {
  return light;
}

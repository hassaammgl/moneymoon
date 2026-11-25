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

/**
 * BrandLogo — the Moneymoon mark (hearts, coin and wedding ring).
 *
 * The source art was keyed out of its paper background, so the mark sits on the
 * cream canvas with no square edge. One asset is used at every size: the header,
 * the sign-in screens and the account page.
 */
import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

const LOGO = require('../../assets/images/logo-mark.png');

export interface BrandLogoProps {
  /** Square size in points. */
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function BrandLogo({ size = 44, style }: BrandLogoProps) {
  return (
    <Image
      source={LOGO}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      transition={0}
      accessibilityLabel="Moneymoon logo"
      accessibilityIgnoresInvertColors
    />
  );
}

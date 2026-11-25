/**
 * Card — the white container every screen is built from (v2).
 *
 * Visuals come from NativeWind classes (white surface, 1px line border, plum
 * hero variant). Geometry — radius, padding, border width — is set with plain
 * `style` props, because those are the properties that misbehaved on device.
 *
 * Radii in use: 20–28. Default is 24.
 */
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface CardProps extends ViewProps {
  /** White card, or the plum hero card. */
  tone?: 'surface' | 'plum';
  /** Inner padding in px. Default 20. */
  padding?: number;
  /** Corner radius in px. Default 24. */
  radius?: number;
  className?: string;
}

const TONE = {
  surface: 'bg-surface border-line',
  plum: 'bg-plum border-plum',
} as const;

export function Card({
  tone = 'surface',
  padding = 20,
  radius = 24,
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <View
      {...rest}
      className={cn(TONE[tone], className)}
      style={[
        {
          borderWidth: 1,
          borderCurve: 'continuous',
          borderRadius: radius,
          padding,
        },
        style,
      ]}
    />
  );
}

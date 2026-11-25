/**
 * ProgressBar — track + fill with a small heart at the fill's edge (v2).
 *
 * The heart is an inline SVG (react-native-svg is already a dependency) and is
 * centred on the leading edge of the fill, so it reads as the tip of the bar.
 *
 * Sizes: 6 (envelope cards), 8 (dream buffer), 12 (hero card). Width comes from
 * the parent; the fill is a percentage of it.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useHeartbeat } from '@/components/ui/motion';
import { colors } from '@/theme';

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export type ProgressHeight = 6 | 8 | 10 | 12;

export interface ProgressBarProps {
  /** Fill fraction, 0–1. Values outside the range are clamped. */
  value: number;
  height?: ProgressHeight;
  /** Fill colour. Defaults to emerald. */
  color?: string;
  /** Track colour. Defaults to the warm track token. */
  trackColor?: string;
  /** Heart at the fill edge. Defaults to on. */
  heart?: boolean;
  /** Gentle heartbeat on the heart. Off by default so small bars stay calm. */
  pulse?: boolean;
  /** Heart colour. Defaults to the fill colour. */
  heartColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  value,
  height = 8,
  color = colors.emerald,
  trackColor = colors.track,
  heart = true,
  pulse = false,
  heartColor,
  accessibilityLabel,
  style,
}: ProgressBarProps) {
  const heartbeat = useHeartbeat();
  const percent = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const heartSize = height + 4;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent * 100) }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor,
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${percent * 100}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />

      {heart && percent > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: `${percent * 100}%`,
              top: (height - heartSize) / 2,
              marginLeft: -heartSize / 2,
              width: heartSize,
              height: heartSize,
            },
            pulse ? { transform: [{ scale: heartbeat }] } : null,
          ]}
        >
          <Svg width={heartSize} height={heartSize} viewBox="0 0 24 24">
            <Path d={HEART_PATH} fill={heartColor ?? color} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

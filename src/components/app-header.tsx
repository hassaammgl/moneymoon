/**
 * AppHeader — household identity at the top of the dashboard (v2).
 *
 * A normal row in the scroll flow (not absolute, not sticky): soft-rose logo
 * tile with a roof and two hearts, the household name in Fraunces, the month
 * subtitle, and one status pill on the right with the two avatars and "Synced".
 *
 * Motion: the two hearts beat gently and the sync dot pulses, both on the
 * native driver via the shared motion hooks.
 */
import { Animated, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { useHeartbeat, usePulse } from '@/components/ui/motion';
import { monthLabelOf } from '@/lib/month';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

function Logo() {
  const heartbeat = useHeartbeat();

  return (
    <View
      className="bg-rose-soft"
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
      }}
    >
      {/* Roof */}
      <Svg
        width={44}
        height={44}
        viewBox="0 0 44 44"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Path
          d="M10 20 L22 9 L34 20"
          stroke={colors.ink}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>

      {/* Two interlocking hearts — rose and emerald. The layer is cropped to
          their bounding box so the scale pivots on the hearts themselves. */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 10,
          top: 23,
          width: 24,
          height: 14,
          transform: [{ scale: heartbeat }],
        }}
      >
        <Svg width={24} height={14} viewBox="10 23 24 14">
          <G transform="translate(11.5 24) scale(0.55)">
            <Path d={HEART_PATH} fill={colors.rose} />
          </G>
          <G transform="translate(20.5 24) scale(0.55)">
            <Path d={HEART_PATH} fill={colors.emerald} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

function Avatar({
  letter,
  background,
  color,
  style,
}: {
  letter: string;
  background: string;
  color: string;
  style?: { marginLeft?: number };
}) {
  return (
    <View
      style={[
        {
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          borderWidth: 1.5,
          borderColor: colors.surface,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts['sans-semibold'], fontSize: 10, color }}>{letter}</Text>
    </View>
  );
}

function SyncPill() {
  const pulse = usePulse();
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });

  return (
    <View
      className="bg-surface border-chip-border"
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <Avatar letter="H" background={colors.ink} color={colors.cream} />
        <Avatar letter="W" background={colors.rose} color={colors.surface} style={{ marginLeft: -8 }} />
      </View>
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.emerald,
          opacity: dotOpacity,
          transform: [{ scale: dotScale }],
        }}
      />
      <Text
        style={{
          fontFamily: fonts['sans-semibold'],
          fontSize: 12,
          lineHeight: 16,
          color: colors['emerald-ink'],
        }}
      >
        Synced
      </Text>
    </View>
  );
}

export function AppHeader() {
  const { household, month } = useBudget();
  const monthName = monthLabelOf(month.id).split(' ')[0] ?? '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
        <Logo />
        <View style={{ flexShrink: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.display,
              fontSize: 20,
              lineHeight: 24,
              color: colors.ink,
            }}
          >
            {household.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              lineHeight: 16,
              color: colors['ink-muted'],
            }}
          >
            {`${monthName} budget`}
          </Text>
        </View>
      </View>

      <SyncPill />
    </View>
  );
}

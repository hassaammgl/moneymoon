/**
 * AppHeader — household identity at the top of the dashboard (v2).
 *
 * A normal row in the scroll flow (not absolute, not sticky): the Moneymoon
 * mark, the household name in Fraunces, the month subtitle, and one status
 * pill on the right with the two avatars and "Synced".
 *
 * Motion: the sync dot pulses on the native driver via the shared motion hook.
 */
import { Animated, Text, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { usePulse } from '@/components/ui/motion';
import type { Member } from '@/domain/types';
import { monthLabelOf } from '@/lib/month';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

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

function SyncPill({ members }: { members: readonly Member[] }) {
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
        {members.map((member, index) => (
          <Avatar
            key={member.id}
            letter={member.displayName.charAt(0)}
            background={member.colorKey === 'ink' ? colors.ink : colors.rose}
            color={member.colorKey === 'ink' ? colors.cream : colors.surface}
            style={index > 0 ? { marginLeft: -8 } : undefined}
          />
        ))}
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
  const { household, members, month } = useBudget();
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
        <BrandLogo size={44} />
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

      <SyncPill members={members} />
    </View>
  );
}

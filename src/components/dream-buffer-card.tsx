/**
 * DreamBufferCard — how the money outside the envelopes is growing (v2).
 *
 * Buffer and goal both come from the mock data; the percentage is derived.
 */
import { PiggyBank } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { BUFFER_GOAL } from '@/data/mock';
import { bufferOf } from '@/lib/budget';
import { formatAmount, progressOf } from '@/lib/money';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

export function DreamBufferCard() {
  const { month } = useBudget();
  const buffer = bufferOf(month.income, month.limits);
  const target = BUFFER_GOAL.target;
  const progress = progressOf(buffer, target);
  const percent = Math.round(progress * 100);

  return (
    <Card radius={24} padding={18}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          className="bg-emerald-soft"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PiggyBank size={20} color={colors['emerald-ink']} strokeWidth={1.75} />
        </View>

        <View style={{ flexShrink: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.display,
              fontSize: 17,
              lineHeight: 22,
              color: colors.ink,
            }}
          >
            Our Dream Buffer
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts['sans-medium'],
              fontSize: 12,
              lineHeight: 16,
              color: colors['emerald-ink'],
            }}
          >
            {`${percent}% there`}
          </Text>
        </View>
      </View>

      <ProgressBar
        value={progress}
        height={8}
        pulse
        accessibilityLabel={`Dream buffer: ${percent} percent of goal`}
        style={{ marginTop: 14 }}
      />

      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 12,
          lineHeight: 16,
          marginTop: 8,
          color: colors['ink-muted'],
        }}
      >
        {`Rs ${formatAmount(buffer)} of Rs ${formatAmount(target)}`}
      </Text>
    </Card>
  );
}

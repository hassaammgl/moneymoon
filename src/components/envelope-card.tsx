/**
 * EnvelopeCard — one envelope group in the dashboard grid (v2).
 *
 * Soft icon square, group name, the money left in Fraunces, the pool it came
 * from, and a 6px bar whose fill is the share spent. Her Kharcha is the only
 * card with a rose bar.
 */
import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatAmount, progressOf } from '@/lib/money';
import { colors, fonts } from '@/theme';

export interface EnvelopeCardProps {
  name: string;
  icon: LucideIcon;
  /** Spent against this group's pooled limits. */
  spent: number;
  /** Sum of the group's envelope limits. */
  limit: number;
  /** Rose is reserved for Her Kharcha. */
  tone?: 'emerald' | 'rose';
}

export function EnvelopeCard({
  name,
  icon: Icon,
  spent,
  limit,
  tone = 'emerald',
}: EnvelopeCardProps) {
  const isRose = tone === 'rose';
  const left = limit - spent;
  const progress = progressOf(spent, limit);

  return (
    <Card radius={20} padding={14} style={{ flex: 1 }}>
      <View
        className={isRose ? 'bg-rose-soft' : 'bg-emerald-soft'}
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={18}
          color={isRose ? colors['rose-ink'] : colors['emerald-ink']}
          strokeWidth={1.75}
        />
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontFamily: fonts['sans-semibold'],
          fontSize: 12,
          lineHeight: 16,
          marginTop: 10,
          minHeight: 32,
          color: colors.ink,
        }}
      >
        {name}
      </Text>

      <Money amount={left} size="md" style={{ marginTop: 2 }} />

      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.sans,
          fontSize: 11,
          lineHeight: 15,
          marginTop: 2,
          color: colors['ink-muted'],
        }}
      >
        {`left of Rs ${formatAmount(limit)}`}
      </Text>

      <ProgressBar
        value={progress}
        height={6}
        color={isRose ? colors.rose : colors.emerald}
        accessibilityLabel={`${name}: ${Math.round(progress * 100)} percent spent`}
        style={{ marginTop: 10 }}
      />
    </Card>
  );
}

/**
 * EnvelopeCard — one envelope group, or one custom envelope, in the dashboard
 * grid (v2).
 *
 * Soft icon square, name, the money left in Fraunces, the pool it came from,
 * and a 6px bar whose fill is the share spent. Rose is reserved for Her Kharcha
 * and for going over; every other tone keeps emerald meaning "healthy budget".
 */
import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { ProgressBar } from '@/components/ui/progress-bar';
import { statusOf } from '@/lib/budget';
import { formatAmount, progressOf } from '@/lib/money';
import { colors, fonts } from '@/theme';

type CardTone = 'emerald' | 'rose' | 'lilac' | 'amber' | 'mint';

const TILE_CLASS: Record<CardTone, string> = {
  emerald: 'bg-emerald-soft',
  rose: 'bg-rose-soft',
  lilac: 'bg-lilac',
  amber: 'bg-amber',
  mint: 'bg-emerald-soft-strong',
};

const ICON_COLOR: Record<CardTone, string> = {
  emerald: colors['emerald-ink'],
  rose: colors['rose-ink'],
  lilac: colors['ink-2'],
  amber: colors['amber-ink'],
  mint: colors['emerald-ink'],
};

const BAR_COLOR: Record<CardTone, string> = {
  emerald: colors.emerald,
  rose: colors.rose,
  lilac: colors.accent,
  amber: colors['amber-accent'],
  mint: colors.emerald,
};

export interface EnvelopeCardProps {
  name: string;
  icon: LucideIcon;
  /** Spent against this group's pooled limits. */
  spent: number;
  /** Sum of the group's envelope limits. */
  limit: number;
  /** Rose is reserved for Her Kharcha and for a custom rose category. */
  tone?: CardTone;
}

export function EnvelopeCard({
  name,
  icon: Icon,
  spent,
  limit,
  tone = 'emerald',
}: EnvelopeCardProps) {
  const left = limit - spent;
  const progress = progressOf(spent, limit);
  const isOver = statusOf(spent, limit) === 'over';
  const barColor = isOver ? colors.rose : BAR_COLOR[tone];

  return (
    <Card radius={20} padding={14} style={{ flex: 1 }}>
      <View
        className={TILE_CLASS[tone]}
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={ICON_COLOR[tone]} strokeWidth={1.75} />
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

      <Money
        amount={left}
        size="md"
        color={isOver ? colors['rose-ink'] : colors.ink}
        style={{ marginTop: 2 }}
      />

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
        color={barColor}
        accessibilityLabel={`${name}: ${Math.round(progress * 100)} percent spent`}
        style={{ marginTop: 10 }}
      />
    </Card>
  );
}

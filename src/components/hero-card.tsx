/**
 * HeroCard — the plum headline card on the dashboard (v2).
 *
 * Everything shown is computed from the shared month: income, total spend, what
 * is left, and the buffer that never entered an envelope.
 */
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { ProgressBar } from '@/components/ui/progress-bar';
import { bufferOf, combinedIncome, leftOf, totalSpent } from '@/lib/budget';
import { formatAmount } from '@/lib/money';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

function StatBox({
  label,
  amount,
  valueColor,
}: {
  label: string;
  amount: number;
  valueColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 16,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.sans,
          fontSize: 11,
          lineHeight: 14,
          color: colors['cream-muted'],
        }}
      >
        {label}
      </Text>
      <Money amount={amount} size="md" color={valueColor} style={{ marginTop: 4 }} />
    </View>
  );
}

export function HeroCard() {
  const { month, expenses } = useBudget();
  const income = combinedIncome(month.incomes);
  const spent = totalSpent(expenses);
  const left = leftOf(income, expenses);
  const buffer = bufferOf(income, month.limits);
  const used = income > 0 ? spent / income : 0;

  return (
    <Card tone="plum" radius={28} padding={22}>
      <Text
        style={{
          fontFamily: fonts['sans-medium'],
          fontSize: 12,
          lineHeight: 16,
          color: colors['cream-muted'],
        }}
      >
        Left this month
      </Text>

      <Money amount={left} size="hero" color={colors.cream} style={{ marginTop: 6 }} />

      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 12,
          lineHeight: 16,
          color: colors['cream-muted'],
        }}
      >
        {`of Rs ${formatAmount(income)} combined income`}
      </Text>

      <ProgressBar
        value={used}
        height={10}
        color={colors['mint-on-dark']}
        trackColor="rgba(255, 255, 255, 0.18)"
        pulse
        accessibilityLabel="Spent this month"
        style={{ marginTop: 18 }}
      />

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
        <StatBox label="Spent together" amount={spent} valueColor={colors.cream} />
        <StatBox
          label="Future buffer"
          amount={buffer}
          valueColor={colors['mint-on-dark-soft']}
        />
      </View>
    </Card>
  );
}

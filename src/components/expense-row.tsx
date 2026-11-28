/**
 * ExpenseRow — one line in the Recent activity list (v2).
 *
 * Icon tile, note, payer pill + relative time, and the amount as a debit on the
 * right. Rose is used only for the wife's own spending; every other tile is
 * neutral so emerald keeps meaning "healthy budget".
 */
import { Wallet } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { Money } from '@/components/ui/money';
import { findEnvelope } from '@/constants/envelopes';
import type { Expense } from '@/domain/types';
import { timeAgo } from '@/lib/time';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

export interface ExpenseRowProps {
  expense: Expense;
  /** Tapping the row opens it for editing. */
  onPress?: (expense: Expense) => void;
  /** Prefix the meta line with the envelope name (history rows). */
  showCategory?: boolean;
}

export function ExpenseRow({ expense, onPress, showCategory = false }: ExpenseRowProps) {
  const { members, customEnvelopes } = useBudget();
  const envelope = findEnvelope(expense.envelopeId, customEnvelopes);
  const Icon = envelope?.icon ?? Wallet;
  const isHers = envelope?.isHers ?? false;
  const payer = members.find((member) => member.id === expense.paidBy);
  const payerName = payer?.displayName ?? 'Unknown';
  const payerRose = payer?.colorKey === 'rose';

  // Geometry lives on an inner View: a function `style` on Pressable is not
  // applied through NativeWind's interop, which left the row stacked as a
  // column with no padding. The function style now only dims on press.
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Edit ${expense.note}` : undefined}
      onPress={onPress ? () => onPress(expense) : undefined}
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.55 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View
          className={isHers ? 'bg-rose-soft' : 'bg-track'}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            size={18}
            color={isHers ? colors['rose-ink'] : colors['ink-muted']}
            strokeWidth={1.75}
          />
        </View>

        <View style={{ flex: 1, flexShrink: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts['sans-semibold'],
              fontSize: 14,
              lineHeight: 19,
              color: colors.ink,
            }}
          >
            {expense.note}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <Pill label={payerName} tone={payerRose ? 'rose' : 'outline'} />
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontFamily: fonts.sans,
                fontSize: 11,
                lineHeight: 15,
                color: colors['ink-muted'],
              }}
            >
              {showCategory
                ? `${envelope?.shortName ?? 'Envelope'} · ${timeAgo(expense.createdAt)}`
                : timeAgo(expense.createdAt)}
            </Text>
          </View>
        </View>

        <Money amount={expense.amount} size="sm" debit />
      </View>
    </Pressable>
  );
}

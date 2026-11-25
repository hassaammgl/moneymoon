/**
 * ExpenseRow — one line in the Recent activity list (v2).
 *
 * Icon tile, note, payer pill + relative time, and the amount as a debit on the
 * right. Rose is used only for the wife's own spending; every other tile is
 * neutral so emerald keeps meaning "healthy budget".
 */
import { Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { Money } from '@/components/ui/money';
import { getEnvelope } from '@/constants/envelopes';
import type { Expense, Payer } from '@/data/mock';
import { MOCK_NOW } from '@/data/mock';
import { timeAgo } from '@/lib/time';
import { colors, fonts } from '@/theme';

const PAYER_LABEL: Record<Payer, string> = {
  husband: 'Husband',
  wife: 'Wife',
};

export interface ExpenseRowProps {
  expense: Expense;
}

export function ExpenseRow({ expense }: ExpenseRowProps) {
  const envelope = getEnvelope(expense.envelopeId);
  const Icon = envelope.icon;
  const isHers = envelope.isHers;

  return (
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
          <Pill
            label={PAYER_LABEL[expense.paidBy]}
            tone={expense.paidBy === 'wife' ? 'rose' : 'outline'}
          />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.sans,
              fontSize: 11,
              lineHeight: 15,
              color: colors['ink-muted'],
            }}
          >
            {timeAgo(expense.createdAt, MOCK_NOW.getTime())}
          </Text>
        </View>
      </View>

      <Money amount={expense.amount} size="sm" debit />
    </View>
  );
}

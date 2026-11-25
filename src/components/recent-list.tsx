/**
 * RecentList — the four latest expenses (v2).
 *
 * Tapping a row opens it for editing; "View all" opens the full history. Both
 * are optional so the card still renders on its own.
 */
import { Pressable, Text, View } from 'react-native';

import { ExpenseRow } from '@/components/expense-row';
import { Card } from '@/components/ui/card';
import type { Expense } from '@/domain/types';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

export interface RecentListProps {
  onSelect?: (expense: Expense) => void;
  onViewAll?: () => void;
}

export function RecentList({ onSelect, onViewAll }: RecentListProps) {
  const { expenses } = useBudget();
  const recent = [...expenses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 20,
            lineHeight: 26,
            color: colors.ink,
          }}
        >
          Recent
        </Text>

        {onViewAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all expenses"
            hitSlop={8}
            onPress={onViewAll}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
          >
            <Text
              style={{
                fontFamily: fonts['sans-semibold'],
                fontSize: 13,
                lineHeight: 18,
                color: colors['emerald-ink'],
              }}
            >
              View all
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Card radius={20} padding={0}>
        {recent.length === 0 ? (
          <Text
            style={{
              paddingHorizontal: 16,
              paddingVertical: 20,
              textAlign: 'center',
              fontFamily: fonts.sans,
              fontSize: 12,
              lineHeight: 17,
              color: colors['ink-muted'],
            }}
          >
            No expenses yet — tap + to log one.
          </Text>
        ) : null}

        {recent.map((expense, index) => (
          <View key={expense.id}>
            {index > 0 ? (
              <View style={{ height: 1, backgroundColor: colors.line }} />
            ) : null}
            <ExpenseRow expense={expense} onPress={onSelect} />
          </View>
        ))}
      </Card>
    </View>
  );
}

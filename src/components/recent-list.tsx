/**
 * RecentList — the four latest expenses (v2).
 */
import { Text, View } from 'react-native';

import { ExpenseRow } from '@/components/expense-row';
import { Card } from '@/components/ui/card';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

export function RecentList() {
  const { expenses } = useBudget();
  const recent = [...expenses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <View style={{ gap: 12 }}>
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

      <Card radius={20} padding={0}>
        {recent.map((expense, index) => (
          <View key={expense.id}>
            {index > 0 ? (
              <View style={{ height: 1, backgroundColor: colors.line }} />
            ) : null}
            <ExpenseRow expense={expense} />
          </View>
        ))}
      </Card>
    </View>
  );
}

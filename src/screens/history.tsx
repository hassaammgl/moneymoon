/**
 * History — every expense in the month, newest first, grouped by day.
 *
 * The screen is a pushed route like Our Plan: back arrow, the same bottom nav
 * and FAB, and the same Add Expense sheet for editing. It reads the shared
 * store, so anything saved or deleted here updates Home and Plan at once.
 */
import { ChevronLeft, Receipt } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseSheet } from '@/components/add-expense-sheet';
import { BottomNav, BOTTOM_NAV_SPACE } from '@/components/bottom-nav';
import { ExpenseRow } from '@/components/expense-row';
import { Card } from '@/components/ui/card';
import type { Expense } from '@/data/mock';
import { dayKey, dayLabel } from '@/lib/time';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

interface DayGroup {
  key: string;
  label: string;
  items: Expense[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expenses } = useBudget();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const openNewExpense = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openExpense = (expense: Expense) => {
    setEditing(expense);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
  };

  const groups: DayGroup[] = [];
  for (const expense of [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const key = dayKey(expense.createdAt);
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.items.push(expense);
    } else {
      groups.push({ key, label: dayLabel(expense.createdAt), items: [expense] });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: BOTTOM_NAV_SPACE + insets.bottom,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 680,
              alignSelf: 'center',
              gap: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to dashboard"
                hitSlop={8}
                onPress={goHome}
                className="bg-surface border-chip-border"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
              </Pressable>

              <View style={{ flexShrink: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 24,
                    lineHeight: 30,
                    color: colors.ink,
                  }}
                >
                  History
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
                  {expenses.length === 1 ? '1 expense' : `${expenses.length} expenses`}
                </Text>
              </View>
            </View>

            {groups.length === 0 ? (
              <Card radius={24} padding={24}>
                <View style={{ alignItems: 'center', gap: 8 }}>
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
                    <Receipt size={20} color={colors['emerald-ink']} strokeWidth={1.75} />
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 17,
                      lineHeight: 22,
                      color: colors.ink,
                    }}
                  >
                    Nothing logged yet
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 12,
                      lineHeight: 17,
                      textAlign: 'center',
                      color: colors['ink-muted'],
                    }}
                  >
                    Tap the + button to add your first shared spend.
                  </Text>
                </View>
              </Card>
            ) : (
              groups.map((group) => (
                <View key={group.key} style={{ gap: 10 }}>
                  <Text
                    style={{
                      fontFamily: fonts['sans-semibold'],
                      fontSize: 11,
                      lineHeight: 15,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: colors['ink-muted'],
                    }}
                  >
                    {group.label}
                  </Text>

                  <Card radius={20} padding={0}>
                    {group.items.map((expense, index) => (
                      <View key={expense.id}>
                        {index > 0 ? (
                          <View style={{ height: 1, backgroundColor: colors.line }} />
                        ) : null}
                        <ExpenseRow
                          expense={expense}
                          showCategory
                          onPress={openExpense}
                        />
                      </View>
                    ))}
                  </Card>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav
        active="home"
        onTabPress={(tab) => (tab === 'plan' ? router.push('/plan') : goHome())}
        onAddPress={openNewExpense}
      />

      <AddExpenseSheet
        key={editing?.id ?? 'new'}
        visible={sheetOpen}
        expense={editing}
        onClose={closeSheet}
      />
    </View>
  );
}

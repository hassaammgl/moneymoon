/**
 * Dashboard — the assembled home screen (steps 5–10).
 *
 * One ScrollView, top to bottom: header, plum hero, dream buffer, envelope
 * grid, recent list. The bottom padding reserves the nav bar plus the FAB's
 * overhang, so nothing is ever hidden behind them.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseSheet } from '@/components/add-expense-sheet';
import { AppHeader } from '@/components/app-header';
import { BottomNav, BOTTOM_NAV_SPACE } from '@/components/bottom-nav';
import { DreamBufferCard } from '@/components/dream-buffer-card';
import { EnvelopeGrid } from '@/components/envelope-grid';
import { HeroCard } from '@/components/hero-card';
import { RecentList } from '@/components/recent-list';
import type { Expense } from '@/domain/types';
import { colors } from '@/theme';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

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
            <AppHeader />
            <HeroCard />
            <DreamBufferCard />
            <EnvelopeGrid onEditPlan={() => router.push('/plan')} />
            <RecentList
              onSelect={openExpense}
              onViewAll={() => router.push('/history')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav
        active="home"
        onTabPress={(tab) => (tab === 'plan' ? router.push('/plan') : undefined)}
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

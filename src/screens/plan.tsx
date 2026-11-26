/**
 * Our Plan — the monthly plan screen (step 13).
 *
 * Step 13a: back header + plum summary card (income, split bar, envelopes and
 * buffer totals). Steps 13b/13c add the envelope rows and the lock button.
 */
import { ChevronLeft, Lock, Unlock, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseSheet } from '@/components/add-expense-sheet';
import { BottomNav, BOTTOM_NAV_SPACE } from '@/components/bottom-nav';
import { PlanEnvelopeRow } from '@/components/plan-envelope-row';
import { Card } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { ENVELOPES } from '@/constants/envelopes';
import { bufferOf, combinedIncome, spentByEnvelope, totalLimits } from '@/lib/budget';
import { formatAmount } from '@/lib/money';
import { monthLabelOf } from '@/lib/month';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

function LegendRow({
  color,
  label,
  amount,
}: {
  color: string;
  label: string;
  amount: number;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            lineHeight: 16,
            color: colors['cream-muted'],
          }}
        >
          {label}
        </Text>
      </View>
      <Money amount={amount} size="sm" color={colors.cream} />
    </View>
  );
}

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { month, expenses, setLimit, lockPlan, unlockPlan, hasBudget } = useBudget();
  const [sheetOpen, setSheetOpen] = useState(false);

  const income = combinedIncome(month.incomes);
  const limits = month.limits;
  const locked = month.locked;
  const spent = spentByEnvelope(expenses);
  const inEnvelopes = totalLimits(limits);
  const buffer = bufferOf(income, limits);
  const envelopeShare = income > 0 ? Math.min(1, inEnvelopes / income) : 0;
  const overBy = Math.max(0, inEnvelopes - income);
  const lockDisabled = !locked && overBy > 0;
  const monthName = monthLabelOf(month.id).split(' ')[0] ?? '';

  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleLockPress = () => {
    if (!locked) {
      lockPlan();
      return;
    }

    Alert.alert('Unlock this plan?', 'You can change the envelope limits again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlock', onPress: unlockPlan },
    ]);
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

              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 24,
                  lineHeight: 30,
                  color: colors.ink,
                }}
              >
                Our Plan
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Household and account"
                hitSlop={8}
                onPress={() => router.push('/household')}
                className="bg-surface border-chip-border"
                style={{
                  marginLeft: 'auto',
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={19} color={colors.ink} strokeWidth={2} />
              </Pressable>
            </View>

            <Card tone="plum" radius={28} padding={20}>
              <Text
                style={{
                  fontFamily: fonts['sans-medium'],
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors['cream-muted'],
                }}
              >
                Combined income
              </Text>

              <Money
                amount={income}
                size="lg"
                color={colors.cream}
                style={{ marginTop: 4 }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  height: 10,
                  marginTop: 16,
                  borderRadius: 5,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                }}
              >
                <View
                  style={{
                    width: `${envelopeShare * 100}%`,
                    backgroundColor: colors.emerald,
                  }}
                />
                <View style={{ flex: 1, backgroundColor: colors.rose }} />
              </View>

              <View style={{ gap: 8, marginTop: 14 }}>
                <LegendRow color={colors.emerald} label="In envelopes" amount={inEnvelopes} />
                <LegendRow color={colors.rose} label="To Dream Buffer" amount={buffer} />
              </View>
            </Card>

            <View style={{ gap: 12 }}>
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 20,
                  lineHeight: 26,
                  color: colors.ink,
                }}
              >
                Envelopes
              </Text>

              {ENVELOPES.map((envelope) => (
                <PlanEnvelopeRow
                  key={envelope.id}
                  envelope={envelope}
                  limit={limits[envelope.id]}
                  spent={spent[envelope.id]}
                  disabled={locked}
                  onChange={(value) => setLimit(envelope.id, value)}
                />
              ))}
            </View>

            <View style={{ gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={locked ? 'Unlock to edit' : 'Lock in our plan'}
                accessibilityState={{ disabled: lockDisabled }}
                disabled={lockDisabled}
                onPress={handleLockPress}
                style={{
                  minHeight: 54,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: locked ? colors['emerald-soft'] : colors['emerald-ink'],
                  opacity: lockDisabled ? 0.45 : 1,
                }}
              >
                {locked ? (
                  <Unlock size={18} color={colors['emerald-ink']} strokeWidth={2} />
                ) : (
                  <Lock size={18} color={colors.cream} strokeWidth={2} />
                )}
                <Text
                  style={{
                    fontFamily: fonts['sans-semibold'],
                    fontSize: 15,
                    lineHeight: 20,
                    color: locked ? colors['emerald-ink'] : colors.cream,
                  }}
                >
                  {locked ? 'Unlock to edit' : 'Lock in our plan'}
                </Text>
              </Pressable>

              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  textAlign: 'center',
                  color:
                    overBy > 0 && !locked ? colors['rose-ink'] : colors['ink-muted'],
                }}
              >
                {locked
                  ? `${monthName}'s limits are locked for both of you.`
                  : overBy > 0
                    ? `Envelopes are Rs ${formatAmount(overBy)} over your income`
                    : `Locks these limits for ${monthName} for both of you.`}
              </Text>

              {!hasBudget ? (
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    lineHeight: 17,
                    textAlign: 'center',
                    color: colors['ink-muted'],
                  }}
                >
                  {`No plan is saved for ${monthName} yet.`}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav
        active="plan"
        onTabPress={(tab) => (tab === 'home' ? goHome() : undefined)}
        onAddPress={() => setSheetOpen(true)}
      />

      <AddExpenseSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

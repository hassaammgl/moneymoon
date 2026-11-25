/**
 * Our Plan — the monthly plan screen (step 13).
 *
 * Step 13a: back header + plum summary card (income, split bar, envelopes and
 * buffer totals). Steps 13b/13c add the envelope rows and the lock button.
 */
import { Check, ChevronLeft, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav, BOTTOM_NAV_SPACE } from '@/components/bottom-nav';
import { PlanEnvelopeRow } from '@/components/plan-envelope-row';
import { Card } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { ENVELOPES, type EnvelopeId } from '@/constants/envelopes';
import { MOCK_MONTH } from '@/data/mock';
import { bufferOf, totalLimits } from '@/lib/budget';
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

  const income = MOCK_MONTH.income;
  const [limits, setLimits] = useState<Record<EnvelopeId, number>>(MOCK_MONTH.limits);
  const [locked, setLocked] = useState(false);
  const inEnvelopes = totalLimits(limits);
  const buffer = bufferOf(income, limits);
  const envelopeShare = income > 0 ? Math.min(1, inEnvelopes / income) : 0;

  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
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
                  onChange={(value) =>
                    setLimits((current) => ({ ...current, [envelope.id]: value }))
                  }
                />
              ))}
            </View>

            <View style={{ gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={locked ? 'Plan locked' : 'Lock in our plan'}
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => setLocked(true)}
                style={{
                  minHeight: 54,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: locked ? colors['emerald-soft'] : colors['emerald-ink'],
                }}
              >
                {locked ? (
                  <Check size={18} color={colors['emerald-ink']} strokeWidth={2.4} />
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
                  {locked ? 'Plan locked' : 'Lock in our plan'}
                </Text>
              </Pressable>

              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  textAlign: 'center',
                  color: colors['ink-muted'],
                }}
              >
                {locked
                  ? "November's limits are locked for both of you."
                  : 'Locks these limits for November for both of you.'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav active="plan" onTabPress={(tab) => (tab === 'home' ? goHome() : undefined)} />
    </View>
  );
}

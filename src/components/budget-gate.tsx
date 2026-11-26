/**
 * The two states that stand between sign-in and the budget: loading a month,
 * and failing to load it.
 *
 * They live above the navigator, so no screen ever renders half a household or
 * a zeroed month while the real rows are still in flight. Styling follows the
 * app's cards so the wait does not look like a different product.
 */
import { RefreshCw } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { colors, fonts } from '@/theme';

function Frame({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingBottom: 48,
          }}
        >
          <View style={{ width: '100%', maxWidth: 460, alignSelf: 'center' }}>{children}</View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export function BudgetLoading() {
  return (
    <Frame>
      <View style={{ alignItems: 'center', gap: 14 }}>
        <ActivityIndicator color={colors.rose} size="large" />
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 18,
            color: colors['ink-muted'],
          }}
        >
          Loading your budget
        </Text>
      </View>
    </Frame>
  );
}

export function BudgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Frame>
      <Card radius={24} padding={22}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 20,
              lineHeight: 26,
              color: colors.ink,
              textAlign: 'center',
            }}
          >
            Could not load your budget
          </Text>

          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              lineHeight: 19,
              color: colors['ink-muted'],
              textAlign: 'center',
            }}
          >
            {message}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try loading the budget again"
            onPress={onRetry}
            style={{
              minHeight: 48,
              marginTop: 8,
              paddingHorizontal: 22,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: colors.rose,
            }}
          >
            <RefreshCw size={16} color={colors.surface} strokeWidth={2} />
            <Text
              style={{
                fontFamily: fonts['sans-semibold'],
                fontSize: 14,
                lineHeight: 19,
                color: colors.surface,
              }}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      </Card>
    </Frame>
  );
}

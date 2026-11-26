import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BudgetError, BudgetLoading } from '@/components/budget-gate';
import { SessionProvider, useSession } from '@/providers/session';
import { BudgetProvider, useBudget } from '@/store/budget-store';
import { colors, fontAssets } from '@/theme';

import '../../global.css';

// Keep the splash up until the fonts are registered, so no screen ever renders
// a fallback typeface.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Render nothing (keeping the splash) until the fonts resolve. On error we
  // still render, so a broken font file shows the fallback instead of a blank
  // screen.
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <BudgetProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </BudgetProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

/**
 * The auth gate.
 *
 * Three exclusive groups: signed out sees login, signed in without a household
 * sees onboarding, signed in with a household sees the budget. Expo Router
 * redirects to the first available screen whenever the active group is closed,
 * so sign-out and joining need no manual navigation.
 *
 * While the session and membership are still resolving we render a plain canvas
 * instead of the navigator, so no group ever opens on a guess.
 */
function RootNavigator() {
  const { status, household } = useSession();
  const budget = useBudget();

  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  const signedIn = status === 'signedIn';
  const hasHousehold = signedIn && household !== null;

  // A member's month is loaded before any screen renders, so the budget UI can
  // never flash zeros, and a failed read gets a message and a retry instead of
  // an empty dashboard.
  if (hasHousehold) {
    if (budget.status === 'error') {
      return (
        <BudgetError
          message={budget.error ?? 'Could not load your budget. Try again.'}
          onRetry={budget.reload}
        />
      );
    }

    if (budget.status !== 'ready') {
      return <BudgetLoading />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && household === null}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && household !== null}>
        <Stack.Screen name="index" />
        <Stack.Screen name="history" />
        <Stack.Screen name="plan" />
        <Stack.Screen name="household" />
      </Stack.Protected>
    </Stack>
  );
}

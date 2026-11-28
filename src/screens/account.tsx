/**
 * Account — who you are, the household you share, and the way out.
 *
 * A bottom-nav destination rather than a pushed screen: it is the fifth slot's
 * home and never traps you, because the nav is always there. The household card
 * links to the invite screen, and sign-out sits at the bottom with a confirm.
 */
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseSheet } from '@/components/add-expense-sheet';
import { BottomNav, BOTTOM_NAV_SPACE } from '@/components/bottom-nav';
import { Card } from '@/components/ui/card';
import { useSession } from '@/providers/session';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, household, signOut } = useSession();
  const { members } = useBudget();
  const [sheetOpen, setSheetOpen] = useState(false);

  const me = members.find((member) => member.userId === session?.user.id);
  const email = session?.user.email ?? '';
  const displayName =
    me?.displayName?.trim() || email.split('@')[0] || 'You';
  const initial = displayName.charAt(0).toUpperCase();
  const partners = members.filter((member) => member.id !== me?.id);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You will need your email code to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
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
          <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center', gap: 20 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 24,
                  lineHeight: 30,
                  color: colors.ink,
                }}
              >
                Account
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  color: colors['ink-muted'],
                }}
              >
                You and the household you share.
              </Text>
            </View>

            <Card radius={24} padding={20}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.ink,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts['sans-semibold'],
                      fontSize: 21,
                      lineHeight: 26,
                      color: colors.cream,
                    }}
                  >
                    {initial}
                  </Text>
                </View>

                <View style={{ flexShrink: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 20,
                      lineHeight: 26,
                      color: colors.ink,
                    }}
                  >
                    {displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 2,
                      fontFamily: fonts.sans,
                      fontSize: 12,
                      lineHeight: 17,
                      color: colors['ink-muted'],
                    }}
                  >
                    {email || 'Signed in'}
                  </Text>
                </View>
              </View>
            </Card>

            <Card radius={24} padding={20}>
              <Text
                style={{
                  fontFamily: fonts['sans-medium'],
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors['ink-muted'],
                }}
              >
                Household
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontFamily: fonts.display,
                  fontSize: 22,
                  lineHeight: 28,
                  color: colors.ink,
                }}
              >
                {household?.name ?? 'Your household'}
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  color: colors['ink-muted'],
                }}
              >
                {partners.length === 0
                  ? 'No partner has joined yet. Send an invite code to start budgeting together.'
                  : `You share this plan with ${partners
                      .map((member) => member.displayName)
                      .join(' and ')}.`}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  partners.length === 0 ? 'Invite your partner' : 'Manage household'
                }
                onPress={() => router.push('/household')}
                style={{
                  marginTop: 14,
                  minHeight: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors['chip-border'],
                  backgroundColor: colors.surface,
                }}
              >
                <View
                  className="bg-rose-soft"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus size={15} color={colors.rose} strokeWidth={2} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts['sans-semibold'],
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.ink,
                  }}
                >
                  {partners.length === 0 ? 'Invite your partner' : 'Manage household'}
                </Text>
                <ChevronRight size={17} color={colors['ink-muted']} strokeWidth={2} />
              </Pressable>
            </Card>

            <Card radius={24} padding={20}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors['ink-muted'],
                  }}
                >
                  Moneymoon
                </Text>
                <Text
                  style={{
                    fontFamily: fonts['sans-medium'],
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors.ink,
                  }}
                >
                  {`Version ${version}`}
                </Text>
              </View>
            </Card>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={confirmSignOut}
              style={{
                minHeight: 50,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors['rose-line'],
                backgroundColor: colors['rose-soft'],
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <LogOut size={17} color={colors['rose-ink']} strokeWidth={2} />
              <Text
                style={{
                  fontFamily: fonts['sans-semibold'],
                  fontSize: 14,
                  lineHeight: 18,
                  color: colors['rose-ink'],
                }}
              >
                Sign out
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav
        active="account"
        onTabPress={(tab) => {
          if (tab === 'home') router.navigate('/');
          if (tab === 'plan') router.navigate('/plan');
          if (tab === 'history') router.navigate('/history');
        }}
        onAddPress={() => setSheetOpen(true)}
      />

      <AddExpenseSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

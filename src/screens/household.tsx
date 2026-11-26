/**
 * Household — invite your partner and sign out.
 *
 * Reachable from Our Plan. The invite is a one-time, seven-day code created by
 * `create_household_invite()`; creating a new one revokes the previous open
 * code, so there is never more than one live code per household.
 *
 * Signing out flips SessionProvider to `signedOut`, and the root gate replaces
 * the app with the login screen.
 */
import { ChevronLeft, LogOut, Share2, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { BOTTOM_NAV_SPACE } from '@/components/bottom-nav';
import { createPartnerInvite, householdErrorMessage } from '@/lib/household';
import { useSession } from '@/providers/session';
import { colors, fonts } from '@/theme';

export default function HouseholdScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { household, session, signOut } = useSession();

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = session?.user.email ?? '';

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/plan');
    }
  };

  const createCode = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const invite = await createPartnerInvite();
      setInviteCode(invite.code);
    } catch (caught) {
      setError(householdErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const shareCode = () => {
    if (!inviteCode) return;

    void Share.share({
      message: `Join our Moneymoon budget. Open the app, choose "Join with a code", and enter ${inviteCode}. The code expires in 7 days.`,
    });
  };

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to Our Plan"
                hitSlop={8}
                onPress={goBack}
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
                Household
              </Text>
            </View>

            <Card radius={24} padding={20}>
              <Text
                style={{
                  fontFamily: fonts['sans-medium'],
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors['ink-muted'],
                }}
              >
                Shared budget
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontFamily: fonts.display,
                  fontSize: 24,
                  lineHeight: 30,
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
                Both partners see the same plan and the same expenses.
              </Text>
            </Card>

            <Card radius={24} padding={20}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  className="bg-rose-soft"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus size={18} color={colors.rose} strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 20,
                    lineHeight: 26,
                    color: colors.ink,
                  }}
                >
                  Invite your partner
                </Text>
              </View>

              <Text
                style={{
                  marginTop: 10,
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors['ink-muted'],
                }}
              >
                Create a code and send it to your partner. They enter it once on
                their own phone. The code expires in seven days.
              </Text>

              {inviteCode ? (
                <View style={{ marginTop: 16, gap: 12 }}>
                  <View
                    style={{
                      alignItems: 'center',
                      paddingVertical: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors['chip-border'],
                      backgroundColor: colors['rose-soft'],
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts['sans-semibold'],
                        fontSize: 26,
                        lineHeight: 32,
                        letterSpacing: 6,
                        color: colors['rose-ink'],
                      }}
                    >
                      {inviteCode}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Share partner code"
                      onPress={shareCode}
                      style={{
                        flex: 1,
                        minHeight: 48,
                        borderRadius: 999,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: colors.rose,
                      }}
                    >
                      <Share2 size={16} color={colors.surface} strokeWidth={2} />
                      <Text
                        style={{
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 14,
                          lineHeight: 18,
                          color: colors.surface,
                        }}
                      >
                        Share code
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Create a new partner code"
                      disabled={busy}
                      onPress={createCode}
                      style={{
                        minHeight: 48,
                        paddingHorizontal: 18,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors['chip-border'],
                        backgroundColor: colors.surface,
                        opacity: busy ? 0.45 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 14,
                          lineHeight: 18,
                          color: colors['emerald-ink'],
                        }}
                      >
                        New code
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create partner code"
                  disabled={busy}
                  onPress={createCode}
                  style={{
                    minHeight: 50,
                    marginTop: 16,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: colors.rose,
                    opacity: busy ? 0.45 : 1,
                  }}
                >
                  <UserPlus size={17} color={colors.surface} strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: fonts['sans-semibold'],
                      fontSize: 14,
                      lineHeight: 18,
                      color: colors.surface,
                    }}
                  >
                    {busy ? 'Creating code...' : 'Create partner code'}
                  </Text>
                </Pressable>
              )}

              {error ? (
                <Text
                  style={{
                    marginTop: 10,
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors['rose-ink'],
                  }}
                >
                  {error}
                </Text>
              ) : null}
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
                Signed in as
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontFamily: fonts['sans-semibold'],
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.ink,
                }}
              >
                {email || 'Your account'}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                onPress={confirmSignOut}
                hitSlop={8}
                style={{
                  marginTop: 14,
                  minHeight: 44,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  alignSelf: 'flex-start',
                }}
              >
                <LogOut size={16} color={colors['rose-ink']} strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: fonts['sans-semibold'],
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors['rose-ink'],
                  }}
                >
                  Sign out
                </Text>
              </Pressable>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

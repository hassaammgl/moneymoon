/**
 * Login — email one-time code (no passwords).
 *
 * Step 1 asks for an email, step 2 verifies the six-digit code Supabase emails.
 * The Supabase session lives in SessionProvider; on success the root gate moves
 * on by itself, so this screen never navigates manually.
 *
 * The project's Magic Link email template must include `{{ .Token }}` for the
 * code to be visible. See supabase/README.md.
 */
import { ArrowLeft, Heart, KeyRound, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Step = 'email' | 'code';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyError(message: string): string {
  if (/rate limit|too many/i.test(message)) {
    return 'Too many emails for now. Wait a minute and try again.';
  }
  if (/expired|invalid/i.test(message)) {
    return 'That code is not valid. Use the newest email.';
  }
  return message;
}

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanEmail = email.trim();
  const emailReady = EMAIL_PATTERN.test(cleanEmail);
  const codeReady = code.trim().length >= 6;

  const sendCode = async () => {
    if (!emailReady || busy) return;

    setBusy(true);
    setError(null);

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true },
    });

    setBusy(false);

    if (sendError) {
      setError(friendlyError(sendError.message));
      return;
    }

    setCode('');
    setStep('code');
  };

  const verifyCode = async () => {
    if (!codeReady || busy) return;

    setBusy(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: code.trim(),
      type: 'email',
    });

    setBusy(false);

    if (verifyError) {
      setError(friendlyError(verifyError.message));
      return;
    }

    // SessionProvider receives SIGNED_IN and the root gate redirects.
  };

  const editEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 24,
              paddingVertical: 32,
            }}
          >
            <View style={{ width: '100%', maxWidth: 460, alignSelf: 'center', gap: 22 }}>
              <View style={{ gap: 14 }}>
                <View
                  className="bg-rose-soft"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Heart size={24} color={colors.rose} fill={colors.rose} strokeWidth={2} />
                </View>

                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 32,
                      lineHeight: 38,
                      color: colors.ink,
                    }}
                  >
                    Welcome to Moneymoon
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors['ink-muted'],
                    }}
                  >
                    One shared budget for the two of you. Sign in with your email.
                  </Text>
                </View>
              </View>

              <Card radius={24} padding={20}>
                {step === 'email' ? (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: fonts['sans-medium'],
                        fontSize: 12,
                        lineHeight: 16,
                        color: colors['ink-muted'],
                      }}
                    >
                      Email
                    </Text>

                    <View style={{ position: 'relative', justifyContent: 'center' }}>
                      <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>
                        <Mail size={17} color={colors['ink-muted']} strokeWidth={1.8} />
                      </View>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={colors['ink-muted']}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        autoFocus
                        returnKeyType="send"
                        onSubmitEditing={sendCode}
                        accessibilityLabel="Email address"
                        style={{
                          height: 52,
                          paddingLeft: 42,
                          paddingRight: 14,
                          borderWidth: 1,
                          borderRadius: 14,
                          borderColor: colors['chip-border'],
                          backgroundColor: colors.surface,
                          fontFamily: fonts.sans,
                          fontSize: 15,
                          color: colors.ink,
                        }}
                      />
                    </View>

                    {error ? (
                      <Text
                        style={{
                          fontFamily: fonts.sans,
                          fontSize: 12,
                          lineHeight: 17,
                          color: colors['rose-ink'],
                        }}
                      >
                        {error}
                      </Text>
                    ) : null}

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send sign-in code"
                      disabled={!emailReady || busy}
                      onPress={sendCode}
                      style={{
                        minHeight: 54,
                        marginTop: 8,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.rose,
                        opacity: emailReady && !busy ? 1 : 0.45,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 15,
                          lineHeight: 20,
                          color: colors.surface,
                        }}
                      >
                        {busy ? 'Sending...' : 'Send sign-in code'}
                      </Text>
                    </Pressable>

                    <Text
                      style={{
                        marginTop: 2,
                        textAlign: 'center',
                        fontFamily: fonts.sans,
                        fontSize: 11,
                        lineHeight: 16,
                        color: colors['ink-muted'],
                      }}
                    >
                      We email a six-digit code. No password to remember.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Use a different email"
                      hitSlop={8}
                      onPress={editEmail}
                      style={{
                        minHeight: 44,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <ArrowLeft size={16} color={colors['emerald-ink']} strokeWidth={2} />
                      <Text
                        style={{
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 12,
                          lineHeight: 16,
                          color: colors['emerald-ink'],
                        }}
                      >
                        Use a different email
                      </Text>
                    </Pressable>

                    <Text
                      style={{
                        fontFamily: fonts.display,
                        fontSize: 20,
                        lineHeight: 26,
                        color: colors.ink,
                      }}
                    >
                      Check your inbox
                    </Text>

                    <Text
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 13,
                        lineHeight: 18,
                        color: colors['ink-muted'],
                      }}
                    >
                      {`We sent a code to ${cleanEmail}. Enter it here within 10 minutes.`}
                    </Text>

                    <View style={{ position: 'relative', justifyContent: 'center', marginTop: 6 }}>
                      <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>
                        <KeyRound size={17} color={colors['ink-muted']} strokeWidth={1.8} />
                      </View>
                      <TextInput
                        value={code}
                        onChangeText={(value) => setCode(value.replace(/[^\d]/g, ''))}
                        placeholder="123456"
                        placeholderTextColor={colors['ink-muted']}
                        keyboardType="number-pad"
                        maxLength={6}
                        returnKeyType="done"
                        onSubmitEditing={verifyCode}
                        accessibilityLabel="Sign-in code"
                        style={{
                          height: 54,
                          paddingLeft: 42,
                          paddingRight: 14,
                          borderWidth: 1,
                          borderRadius: 14,
                          borderColor: colors['chip-border'],
                          backgroundColor: colors.surface,
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 18,
                          letterSpacing: 6,
                          color: colors.ink,
                        }}
                      />
                    </View>

                    {error ? (
                      <Text
                        style={{
                          fontFamily: fonts.sans,
                          fontSize: 12,
                          lineHeight: 17,
                          color: colors['rose-ink'],
                        }}
                      >
                        {error}
                      </Text>
                    ) : null}

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Sign in"
                      disabled={!codeReady || busy}
                      onPress={verifyCode}
                      style={{
                        minHeight: 54,
                        marginTop: 8,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.rose,
                        opacity: codeReady && !busy ? 1 : 0.45,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 15,
                          lineHeight: 20,
                          color: colors.surface,
                        }}
                      >
                        {busy ? 'Signing in...' : 'Sign in'}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send the code again"
                      disabled={busy}
                      onPress={sendCode}
                      hitSlop={8}
                      style={{
                        minHeight: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: busy ? 0.45 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 12,
                          lineHeight: 16,
                          color: colors['emerald-ink'],
                        }}
                      >
                        Send the code again
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Card>

              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: fonts.sans,
                  fontSize: 11,
                  lineHeight: 16,
                  color: colors['ink-muted'],
                }}
              >
                Both partners sign in on their own phone.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

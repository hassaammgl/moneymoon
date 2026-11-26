/**
 * Onboarding — the signed-in partner either starts a household or joins one.
 *
 * Nobody reaches the budget until they have a household: creating or joining
 * resolves the membership and asks SessionProvider to re-read it, and the root
 * gate then swaps this screen for the dashboard.
 *
 * Codes are 8 characters. The creator shares one from Our Plan → Household after
 * the household exists, so this screen only needs the "join" side of the flow.
 */
import { ArrowLeft, ChevronRight, HeartHandshake, KeyRound, Plus, Users } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
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
import { createHousehold, householdErrorMessage, joinHousehold } from '@/lib/household';
import { useSession } from '@/providers/session';
import { colors, fonts } from '@/theme';

type Step = 'choose' | 'create' | 'join';

const CODE_PATTERN = /^[A-Z0-9]{8}$/;

export default function OnboardingScreen() {
  const { refreshHousehold } = useSession();

  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanName = name.trim();
  const cleanCode = code.trim().toUpperCase();
  const nameReady = cleanName.length > 0 && cleanName.length <= 60;
  const codeReady = CODE_PATTERN.test(cleanCode);

  const goTo = (next: Step) => {
    setStep(next);
    setError(null);
  };

  const finish = async (work: Promise<unknown>) => {
    setBusy(true);
    setError(null);

    try {
      await work;
      await refreshHousehold();
    } catch (caught) {
      setError(householdErrorMessage(caught));
      setBusy(false);
    }
  };

  const handleCreate = () => {
    if (!nameReady || busy) return;
    void finish(createHousehold(cleanName));
  };

  const handleJoin = () => {
    if (!codeReady || busy) return;
    void finish(joinHousehold(cleanCode));
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
                  <HeartHandshake size={24} color={colors.rose} strokeWidth={2} />
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
                    {step === 'choose' ? 'Your household' : step === 'create' ? 'Start a household' : 'Join your partner'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors['ink-muted'],
                    }}
                  >
                    {step === 'choose'
                      ? 'A household is the shared budget the two of you keep together.'
                      : step === 'create'
                        ? 'Name the budget you are starting. You will get a code to invite your partner.'
                        : 'Enter the eight-character code your partner shared with you.'}
                  </Text>
                </View>
              </View>

              <Card radius={24} padding={20}>
                {step !== 'choose' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    hitSlop={8}
                    onPress={() => goTo('choose')}
                    style={{
                      minHeight: 44,
                      marginBottom: 4,
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
                      Back
                    </Text>
                  </Pressable>
                ) : null}

                {step === 'choose' ? (
                  <View style={{ gap: 12 }}>
                    <OptionRow
                      icon={<Plus size={19} color={colors['emerald-ink']} strokeWidth={2} />}
                      iconClassName="bg-emerald-soft"
                      title="Create a household"
                      detail="Start the budget and invite your partner."
                      onPress={() => goTo('create')}
                    />

                    <OptionRow
                      icon={<Users size={19} color={colors.rose} strokeWidth={2} />}
                      iconClassName="bg-rose-soft"
                      title="Join with a code"
                      detail="Your partner already started it."
                      onPress={() => goTo('join')}
                    />
                  </View>
                ) : step === 'create' ? (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: fonts['sans-medium'],
                        fontSize: 12,
                        lineHeight: 16,
                        color: colors['ink-muted'],
                      }}
                    >
                      Household name
                    </Text>

                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Our home"
                      placeholderTextColor={colors['ink-muted']}
                      maxLength={60}
                      autoCapitalize="words"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleCreate}
                      accessibilityLabel="Household name"
                      style={{
                        height: 52,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderRadius: 14,
                        borderColor: colors['chip-border'],
                        backgroundColor: colors.surface,
                        fontFamily: fonts.sans,
                        fontSize: 15,
                        color: colors.ink,
                      }}
                    />

                    <ErrorText message={error} />

                    <PrimaryButton
                      label={busy ? 'Creating...' : 'Create household'}
                      disabled={!nameReady || busy}
                      onPress={handleCreate}
                    />
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: fonts['sans-medium'],
                        fontSize: 12,
                        lineHeight: 16,
                        color: colors['ink-muted'],
                      }}
                    >
                      Partner code
                    </Text>

                    <View style={{ position: 'relative', justifyContent: 'center' }}>
                      <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>
                        <KeyRound size={17} color={colors['ink-muted']} strokeWidth={1.8} />
                      </View>
                      <TextInput
                        value={code}
                        onChangeText={(value) => setCode(value.toUpperCase())}
                        placeholder="ABCD1234"
                        placeholderTextColor={colors['ink-muted']}
                        maxLength={8}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleJoin}
                        accessibilityLabel="Partner code"
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
                          letterSpacing: 4,
                          color: colors.ink,
                        }}
                      />
                    </View>

                    <ErrorText message={error} />

                    <PrimaryButton
                      label={busy ? 'Joining...' : 'Join household'}
                      disabled={!codeReady || busy}
                      onPress={handleJoin}
                    />
                  </View>
                )}
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function OptionRow({
  icon,
  iconClassName,
  title,
  detail,
  onPress,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="bg-surface border-chip-border"
      style={{
        minHeight: 72,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        className={iconClassName}
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: fonts['sans-semibold'],
            fontSize: 15,
            lineHeight: 20,
            color: colors.ink,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            lineHeight: 17,
            color: colors['ink-muted'],
          }}
        >
          {detail}
        </Text>
      </View>

      <ChevronRight size={18} color={colors['ink-muted']} strokeWidth={2} />
    </Pressable>
  );
}

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <Text
      style={{
        fontFamily: fonts.sans,
        fontSize: 12,
        lineHeight: 17,
        color: colors['rose-ink'],
      }}
    >
      {message}
    </Text>
  );
}

function PrimaryButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 54,
        marginTop: 8,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.rose,
        opacity: disabled ? 0.45 : 1,
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
        {label}
      </Text>
    </Pressable>
  );
}

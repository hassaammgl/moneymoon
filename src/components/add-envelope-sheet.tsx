/**
 * AddEnvelopeSheet — create a household envelope.
 *
 * The seven built-ins are constants, so this is the only way to get a category
 * that does not exist yet. The sheet collects a name, an icon key, a colour
 * family and an optional first limit for the month on screen; the store mints
 * the uuid and writes the category and its limit in one database call.
 */
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ENVELOPE_ICONS } from '@/constants/envelopes';
import type { EnvelopeIcon, EnvelopeTone } from '@/domain/types';
import { formatAmount, parseAmountInput } from '@/lib/money';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

interface ToneChoice {
  id: EnvelopeTone;
  label: string;
  fill: string;
}

const TONES: readonly ToneChoice[] = [
  { id: 'mint', label: 'Mint', fill: colors.emerald },
  { id: 'lilac', label: 'Lilac', fill: colors['lilac-deep'] },
  { id: 'amber', label: 'Amber', fill: colors['amber-accent'] },
  { id: 'rose', label: 'Rose', fill: colors.rose },
];

const ICON_KEYS = Object.keys(ENVELOPE_ICONS) as EnvelopeIcon[];

export interface AddEnvelopeSheetProps {
  visible: boolean;
  /** "November 2026", for the limit sub-line. */
  monthLabel: string;
  onClose: () => void;
}

export function AddEnvelopeSheet({ visible, monthLabel, onClose }: AddEnvelopeSheetProps) {
  // Mounting fresh on each open seeds a clean form without an effect.
  if (!visible) return null;

  return <EnvelopeForm monthLabel={monthLabel} onClose={onClose} />;
}

function EnvelopeForm({
  monthLabel,
  onClose,
}: Omit<AddEnvelopeSheetProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { addEnvelope } = useBudget();
  const [name, setName] = useState('');
  const [limit, setLimit] = useState(0);
  const [icon, setIcon] = useState<EnvelopeIcon>('wallet');
  const [tone, setTone] = useState<EnvelopeTone>('lilac');

  const cleanName = name.trim();
  const canSave = cleanName.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addEnvelope({ name: cleanName, icon, tone, limit });
    onClose();
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close new envelope sheet"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(42, 31, 36, 0.45)',
          }}
        />

        <View
          className="bg-surface"
          style={{
            maxHeight: '92%',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 8,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors['chip-border'],
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />

          <View style={{ paddingHorizontal: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <View style={{ flexShrink: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 22,
                    lineHeight: 28,
                    color: colors.ink,
                  }}
                >
                  New envelope
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors['ink-muted'],
                  }}
                >
                  A shared category for both of you.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                onPress={onClose}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.track,
                }}
              >
                <X size={18} color={colors.ink} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Name ------------------------------------------------------ */}
            <Text
              style={{
                fontFamily: fonts['sans-medium'],
                fontSize: 12,
                lineHeight: 16,
                color: colors['ink-muted'],
              }}
            >
              Name
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Education, Travel, Savings…"
              placeholderTextColor={colors['ink-muted']}
              maxLength={40}
              returnKeyType="done"
              accessibilityLabel="Envelope name"
              style={{
                height: 52,
                marginTop: 8,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderRadius: 14,
                borderColor: colors['chip-border'],
                backgroundColor: colors.surface,
                fontFamily: fonts.sans,
                fontSize: 14,
                color: colors.ink,
              }}
            />

            {/* Limit ----------------------------------------------------- */}
            <Text
              style={{
                fontFamily: fonts['sans-medium'],
                fontSize: 12,
                lineHeight: 16,
                marginTop: 18,
                color: colors['ink-muted'],
              }}
            >
              {`Limit for ${monthLabel} (optional)`}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                height: 52,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderRadius: 14,
                borderColor: colors['chip-border'],
                backgroundColor: colors.surface,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts['sans-semibold'],
                  fontSize: 14,
                  lineHeight: 19,
                  color: colors['ink-muted'],
                }}
              >
                Rs
              </Text>
              <TextInput
                value={limit > 0 ? formatAmount(limit) : ''}
                onChangeText={(text) => setLimit(parseAmountInput(text))}
                placeholder="0"
                placeholderTextColor={colors['ink-muted']}
                keyboardType="number-pad"
                selectionColor={colors['emerald-ink']}
                accessibilityLabel="Monthly limit in rupees"
                style={{
                  flex: 1,
                  height: 50,
                  padding: 0,
                  fontFamily: fonts.sans,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
            </View>

            {/* Icon ------------------------------------------------------ */}
            <Text
              style={{
                fontFamily: fonts['sans-medium'],
                fontSize: 12,
                lineHeight: 16,
                marginTop: 18,
                color: colors['ink-muted'],
              }}
            >
              Icon
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              {ICON_KEYS.map((key) => {
                const Icon = ENVELOPE_ICONS[key];
                const selected = icon === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Icon ${key.replace(/-/g, ' ')}`}
                    onPress={() => setIcon(key)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      borderWidth: 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors['emerald-soft'] : colors.track,
                      borderColor: selected ? colors['emerald-ink'] : 'transparent',
                    }}
                  >
                    <Icon
                      size={20}
                      color={selected ? colors['emerald-ink'] : colors['ink-muted']}
                      strokeWidth={1.9}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Colour ---------------------------------------------------- */}
            <Text
              style={{
                fontFamily: fonts['sans-medium'],
                fontSize: 12,
                lineHeight: 16,
                marginTop: 18,
                color: colors['ink-muted'],
              }}
            >
              Colour
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              {TONES.map((choice) => {
                const selected = tone === choice.id;
                return (
                  <Pressable
                    key={choice.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${choice.label} colour`}
                    onPress={() => setTone(choice.id)}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderWidth: 1.5,
                      borderRadius: 14,
                      borderColor: selected ? colors.ink : colors['chip-border'],
                      backgroundColor: selected ? colors.track : colors.surface,
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: choice.fill,
                      }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fonts['sans-medium'],
                        fontSize: 12,
                        lineHeight: 16,
                        color: selected ? colors.ink : colors['ink-muted'],
                      }}
                    >
                      {choice.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Save ------------------------------------------------------ */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save envelope"
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={handleSave}
              style={{
                minHeight: 54,
                marginTop: 22,
                marginBottom: 4,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: colors['emerald-ink'],
                opacity: canSave ? 1 : 0.45,
              }}
            >
              <Check size={18} color={colors.cream} strokeWidth={2.4} />
              <Text
                style={{
                  fontFamily: fonts['sans-semibold'],
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.cream,
                }}
              >
                Add envelope
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

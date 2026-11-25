/**
 * AddExpenseSheet — the bottom sheet for logging a spend.
 *
 * Step 12a: shell (handle, title, close).
 * Step 12b: amount card with the big input and quick-add chips.
 * Step 12c: "Paid by" cards and category chips.
 * Step 12d: note and save.
 *
 * Built on React Native's Modal so there is no extra dependency. The backdrop
 * closes the sheet; the close button is a 44px target.
 */
import { Check, Heart, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ENVELOPES, type EnvelopeId } from '@/constants/envelopes';
import type { Expense, Payer } from '@/data/mock';
import { formatAmount, parseAmountInput } from '@/lib/money';
import { colors, fonts } from '@/theme';

const QUICK_AMOUNTS = [100, 500, 1_000] as const;

const PAYERS: readonly { id: Payer; label: string }[] = [
  { id: 'husband', label: 'Husband' },
  { id: 'wife', label: 'Wife' },
];

/** Category chip labels; Her Kharcha reads as "Her", not "Wife's". */
const CATEGORY_LABEL: Record<EnvelopeId, string> = ENVELOPES.reduce(
  (labels, envelope) => ({
    ...labels,
    [envelope.id]: envelope.id === 'her-kharcha' ? 'Her Kharcha' : envelope.shortName,
  }),
  {} as Record<EnvelopeId, string>,
);

export interface AddExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}

export function AddExpenseSheet({ visible, onClose, onSave }: AddExpenseSheetProps) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(0);
  const [paidBy, setPaidBy] = useState<Payer>('wife');
  const [category, setCategory] = useState<EnvelopeId>('groceries');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (amount <= 0) return;

    onSave({
      id: `exp-${Date.now()}`,
      amount,
      paidBy,
      envelopeId: category,
      note: note.trim() || CATEGORY_LABEL[category],
      createdAt: new Date().toISOString(),
      createdByUid: paidBy === 'wife' ? 'uid-wife' : 'uid-husband',
    });

    setAmount(0);
    setPaidBy('wife');
    setCategory('groceries');
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close add expense sheet"
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
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 22,
                  lineHeight: 28,
                  color: colors.ink,
                }}
              >
                Add expense
              </Text>

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
            {/* Amount ----------------------------------------------------- */}
            <View
              style={{
                borderRadius: 20,
                backgroundColor: colors.track,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts['sans-medium'],
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors['ink-muted'],
                }}
              >
                Amount
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts['sans-semibold'],
                    fontSize: 18,
                    lineHeight: 24,
                    color: colors['ink-muted'],
                  }}
                >
                  Rs
                </Text>
                <TextInput
                  value={amount > 0 ? formatAmount(amount) : ''}
                  onChangeText={(text) => setAmount(parseAmountInput(text))}
                  placeholder="0"
                  placeholderTextColor={colors['ink-muted']}
                  keyboardType="number-pad"
                  selectionColor={colors['emerald-ink']}
                  accessibilityLabel="Expense amount in rupees"
                  style={{
                    flex: 1,
                    height: 58,
                    padding: 0,
                    fontFamily: fonts.display,
                    fontSize: 46,
                    lineHeight: 54,
                    letterSpacing: -1,
                    color: colors.ink,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {QUICK_AMOUNTS.map((quick) => (
                  <Pressable
                    key={quick}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${quick} rupees`}
                    onPress={() => setAmount((current) => current + quick)}
                    className="bg-surface border-chip-border"
                    style={{
                      minHeight: 44,
                      justifyContent: 'center',
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts['sans-semibold'],
                        fontSize: 13,
                        lineHeight: 18,
                        color: colors.ink,
                      }}
                    >
                      {`+${formatAmount(quick)}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Paid by ---------------------------------------------------- */}
            <Text
              style={{
                fontFamily: fonts['sans-medium'],
                fontSize: 12,
                lineHeight: 16,
                marginTop: 18,
                color: colors['ink-muted'],
              }}
            >
              Paid by
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              {PAYERS.map((payer) => {
                const selected = paidBy === payer.id;
                return (
                  <Pressable
                    key={payer.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Paid by ${payer.label}`}
                    onPress={() => setPaidBy(payer.id)}
                    style={{
                      flex: 1,
                      minHeight: 56,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      borderWidth: 1,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      backgroundColor: selected ? colors['rose-soft'] : colors.surface,
                      borderColor: selected ? colors['rose-line'] : colors['chip-border'],
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          payer.id === 'husband' ? colors.ink : colors.rose,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts['sans-semibold'],
                          fontSize: 11,
                          lineHeight: 14,
                          color: payer.id === 'husband' ? colors.cream : colors.surface,
                        }}
                      >
                        {payer.label.charAt(0)}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: fonts['sans-semibold'],
                        fontSize: 14,
                        lineHeight: 19,
                        color: selected ? colors['rose-ink'] : colors.ink,
                      }}
                    >
                      {payer.label}
                    </Text>

                    {selected ? (
                      <Check size={16} color={colors['rose-ink']} strokeWidth={2.4} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Category --------------------------------------------------- */}
            <Text
              style={{
                fontFamily: fonts['sans-medium'],
                fontSize: 12,
                lineHeight: 16,
                marginTop: 18,
                color: colors['ink-muted'],
              }}
            >
              Category
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {ENVELOPES.map((envelope) => {
                const selected = category === envelope.id;
                return (
                  <Pressable
                    key={envelope.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={CATEGORY_LABEL[envelope.id]}
                    onPress={() => setCategory(envelope.id)}
                    style={{
                      minHeight: 44,
                      justifyContent: 'center',
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderRadius: 999,
                      backgroundColor: selected ? colors.emerald : colors.surface,
                      borderColor: selected ? colors.emerald : colors['chip-border'],
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fonts['sans-semibold'],
                        fontSize: 13,
                        lineHeight: 18,
                        color: colors.ink,
                      }}
                    >
                      {CATEGORY_LABEL[envelope.id]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Note ------------------------------------------------------- */}
            <Text
              style={{
                fontFamily: fonts['sans-medium'],
                fontSize: 12,
                lineHeight: 16,
                marginTop: 18,
                color: colors['ink-muted'],
              }}
            >
              Note
            </Text>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was it for?"
              placeholderTextColor={colors['ink-muted']}
              returnKeyType="done"
              accessibilityLabel="Expense note"
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

            {/* Save ------------------------------------------------------- */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save expense"
              disabled={amount <= 0}
              onPress={handleSave}
              style={{
                minHeight: 54,
                marginTop: 20,
                marginBottom: 4,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: colors.rose,
                opacity: amount > 0 ? 1 : 0.45,
              }}
            >
              <Heart size={18} color={colors.surface} strokeWidth={2.2} fill={colors.surface} />
              <Text
                style={{
                  fontFamily: fonts['sans-semibold'],
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.surface,
                }}
              >
                Save together
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

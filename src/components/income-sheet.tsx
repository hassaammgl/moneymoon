/**
 * IncomeSheet — edit one partner's monthly income.
 *
 * Income is per partner and per month, and the database only lets a partner
 * write their own row, so Our Plan opens this sheet only for the signed-in
 * member. The household total is never typed here: it stays the sum of both
 * rows and updates on screen after the save.
 *
 * The sheet mounts fresh for each member (the parent unmounts it on close), so
 * the input seeds from the stored amount without a reset effect.
 */
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Member } from '@/domain/types';
import { formatAmount, parseAmountInput } from '@/lib/money';
import { colors, fonts } from '@/theme';

export interface IncomeSheetProps {
  visible: boolean;
  member: Member | null;
  /** The stored amount for the open month, seeded into the input. */
  income: number;
  /** "November 2026", for the sub-line. */
  monthLabel: string;
  onSave: (amount: number) => void;
  onClose: () => void;
}

export function IncomeSheet({ visible, member, ...rest }: IncomeSheetProps) {
  if (!visible || !member) return null;

  return <IncomeForm key={member.id} member={member} {...rest} />;
}

function IncomeForm({
  member,
  income,
  monthLabel,
  onSave,
  onClose,
}: Omit<IncomeSheetProps, 'visible' | 'member'> & { member: Member }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(income);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close income sheet"
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
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 8,
            paddingHorizontal: 20,
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
                Income
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  marginTop: 2,
                  color: colors['ink-muted'],
                }}
              >
                {`${member.displayName} · ${monthLabel}`}
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

          <View
            style={{
              borderRadius: 20,
              backgroundColor: colors.track,
              padding: 16,
              marginTop: 16,
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
              This month
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
                accessibilityLabel="Your income in rupees"
                autoFocus
                style={{
                  flex: 1,
                  height: 58,
                  padding: 0,
                  fontFamily: fonts.display,
                  fontSize: 42,
                  lineHeight: 50,
                  letterSpacing: -1,
                  color: colors.ink,
                }}
              />
            </View>
          </View>

          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              lineHeight: 18,
              marginTop: 12,
              color: colors['ink-muted'],
            }}
          >
            Your partner sets their own income. Combined income is the sum of both rows.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save income"
            onPress={() => {
              onSave(amount);
              onClose();
            }}
            style={{
              marginTop: 16,
              minHeight: 54,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors['emerald-ink'],
            }}
          >
            <Text
              style={{
                fontFamily: fonts['sans-semibold'],
                fontSize: 15,
                lineHeight: 20,
                color: colors.cream,
              }}
            >
              Save income
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

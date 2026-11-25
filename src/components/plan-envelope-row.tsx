/**
 * PlanEnvelopeRow — one editable envelope limit on Our Plan (v2).
 *
 * Name + Fraunces amount, then minus / slider / plus. The slider and buttons
 * share one limit value; the buttons step by 500, the slider by 100, and both
 * clamp to 0…2× the default limit. Her Personal Kharcha is the only rose row.
 */
import Slider from '@react-native-community/slider';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { Envelope } from '@/constants/envelopes';
import { Money } from '@/components/ui/money';
import { colors, fonts } from '@/theme';

const BUTTON_STEP = 500;
const SLIDER_STEP = 100;

export interface PlanEnvelopeRowProps {
  envelope: Envelope;
  limit: number;
  onChange: (limit: number) => void;
  /** True while the month is locked: slider and both buttons stop. */
  disabled?: boolean;
}

export function PlanEnvelopeRow({
  envelope,
  limit,
  onChange,
  disabled = false,
}: PlanEnvelopeRowProps) {
  const isHers = envelope.isHers;
  const max = envelope.limit * 2;
  const accent = isHers ? colors.rose : colors.emerald;
  const accentInk = isHers ? colors['rose-ink'] : colors['emerald-ink'];

  const clamp = (value: number) => Math.max(0, Math.min(max, Math.round(value)));

  return (
    <View
      style={{
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        backgroundColor: isHers ? colors['rose-soft'] : colors.surface,
        borderColor: isHers ? colors['rose-line'] : colors.line,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text
          numberOfLines={2}
          style={{
            flexShrink: 1,
            fontFamily: fonts['sans-semibold'],
            fontSize: 14,
            lineHeight: 19,
            color: isHers ? colors['rose-ink'] : colors.ink,
          }}
        >
          {envelope.name}
        </Text>

        <Money
          amount={limit}
          size="lg"
          color={isHers ? colors['rose-ink'] : colors.ink}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${envelope.name} limit`}
          accessibilityState={{ disabled }}
          disabled={disabled || limit <= 0}
          onPress={() => onChange(clamp(limit - BUTTON_STEP))}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
            borderColor: isHers ? colors['rose-line'] : colors['chip-border'],
            opacity: disabled || limit <= 0 ? 0.4 : 1,
          }}
        >
          <Minus size={18} color={accentInk} strokeWidth={2.2} />
        </Pressable>

        <Slider
          value={limit}
          minimumValue={0}
          maximumValue={max}
          step={SLIDER_STEP}
          disabled={disabled}
          onValueChange={(value) => onChange(clamp(value))}
          minimumTrackTintColor={accent}
          maximumTrackTintColor={colors.track}
          thumbTintColor={accent}
          accessibilityLabel={`${envelope.name} limit`}
          accessibilityState={{ disabled }}
          style={{ flex: 1, height: 44, opacity: disabled ? 0.5 : 1 }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${envelope.name} limit`}
          accessibilityState={{ disabled }}
          disabled={disabled || limit >= max}
          onPress={() => onChange(clamp(limit + BUTTON_STEP))}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
            borderColor: isHers ? colors['rose-line'] : colors['chip-border'],
            opacity: disabled || limit >= max ? 0.4 : 1,
          }}
        >
          <Plus size={18} color={accentInk} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

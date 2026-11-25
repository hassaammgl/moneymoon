/**
 * Pill — small status label that hugs its own text (v2).
 *
 * Three tones, each with one job:
 * - `rose`    soft rose: the couple
 * - `outline` white with a chip border: a person ("Husband")
 * - `mint`    soft emerald: "Synced" / healthy state
 *
 * Layout is plain `style`: the row direction and `alignSelf: 'flex-start'` are
 * explicit so a pill can never stretch into a tall capsule inside a column.
 */
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { fonts } from '@/theme';

export type PillTone = 'rose' | 'outline' | 'mint';

export interface PillProps {
  label: string;
  tone?: PillTone;
  /** Leading status dot in the tone's ink colour. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONE = {
  rose: { box: 'bg-rose-soft', text: 'text-rose-ink', dot: 'bg-rose' },
  outline: { box: 'bg-surface border-chip-border', text: 'text-ink', dot: 'bg-ink' },
  mint: { box: 'bg-emerald-soft', text: 'text-emerald-ink', dot: 'bg-emerald' },
} as const;

export function Pill({ label, tone = 'mint', dot = false, style }: PillProps) {
  return (
    <View
      className={cn('rounded-full', TONE[tone].box)}
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderWidth: tone === 'outline' ? 1 : 0,
        },
        style,
      ]}
    >
      {dot ? (
        <View style={{ width: 6, height: 6, borderRadius: 3 }} className={TONE[tone].dot} />
      ) : null}
      <Text
        numberOfLines={1}
        className={TONE[tone].text}
        style={{ fontFamily: fonts['sans-semibold'], fontSize: 12, lineHeight: 16 }}
      >
        {label}
      </Text>
    </View>
  );
}

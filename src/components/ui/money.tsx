/**
 * Money — a formatted PKR amount in Fraunces (v2).
 *
 * One Text node, so "Rs 32,470" and "- Rs 600" always sit on one baseline and
 * never wrap between the prefix and the number.
 *
 * Sizes: hero 46 (hero card), lg 22 (plan rows), md 20 (envelope cards),
 * sm 15 (activity rows).
 */
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { formatDebit, formatRs } from '@/lib/money';
import { colors, fonts } from '@/theme';

export type MoneySize = 'hero' | 'lg' | 'md' | 'sm';

export interface MoneyProps {
  /** Whole PKR. Always an integer. */
  amount: number;
  size?: MoneySize;
  /** Render as a debit: "- Rs 600". */
  debit?: boolean;
  /** Text colour. Defaults to ink. */
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

const SIZE = {
  hero: { fontSize: 46, lineHeight: 52, letterSpacing: -1 },
  lg: { fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  md: { fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  sm: { fontSize: 15, lineHeight: 20, letterSpacing: 0 },
} as const;

export function Money({
  amount,
  size = 'md',
  debit = false,
  color = colors.ink,
  numberOfLines = 1,
  style,
}: MoneyProps) {
  const scale = SIZE[size];

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: fonts.display,
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          letterSpacing: scale.letterSpacing,
          color,
        },
        style,
      ]}
    >
      {debit ? formatDebit(amount) : formatRs(amount)}
    </Text>
  );
}

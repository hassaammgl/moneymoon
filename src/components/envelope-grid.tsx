/**
 * EnvelopeGrid — the 2×2 envelope summary under "Envelopes" (v2).
 *
 * Group display names are a dashboard concern, so the rename from the
 * constants file's internal names lives here and the constants stay frozen.
 */
import { Pressable, Text, View } from 'react-native';

import { EnvelopeCard } from '@/components/envelope-card';
import { ENVELOPE_GROUPS, type EnvelopeGroupId } from '@/constants/envelopes';
import { limitsByGroup, spentByGroup } from '@/lib/budget';
import { useBudget } from '@/store/budget-store';
import { colors, fonts } from '@/theme';

const GROUP_LABEL: Record<EnvelopeGroupId, string> = {
  groceries: 'Kitchen & Groceries',
  nest: 'Our Nest & Bills',
  her: 'Her Kharcha & Joy',
  commuteCare: 'Commute & Care',
};

export interface EnvelopeGridProps {
  onEditPlan?: () => void;
}

export function EnvelopeGrid({ onEditPlan }: EnvelopeGridProps) {
  const { month, expenses } = useBudget();
  const spent = spentByGroup(expenses);
  const limits = limitsByGroup(month.limits);
  const rows = [ENVELOPE_GROUPS.slice(0, 2), ENVELOPE_GROUPS.slice(2)];

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 20,
            lineHeight: 26,
            color: colors.ink,
          }}
        >
          Envelopes
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit budget plan"
          hitSlop={8}
          onPress={onEditPlan}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
        >
          <Text
            style={{
              fontFamily: fonts['sans-semibold'],
              fontSize: 13,
              lineHeight: 18,
              color: colors['emerald-ink'],
            }}
          >
            Edit plan
          </Text>
        </Pressable>
      </View>

      {rows.map((row) => (
        <View
          key={row[0].id}
          style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}
        >
          {row.map((group) => (
            <EnvelopeCard
              key={group.id}
              name={GROUP_LABEL[group.id]}
              icon={group.icon}
              spent={spent[group.id]}
              limit={limits[group.id]}
              tone={group.id === 'her' ? 'rose' : 'emerald'}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * BottomNav — the two tabs plus the floating add button (v2).
 *
 * The bar is pinned to the bottom of the screen; screens reserve space for it
 * (see `BOTTOM_NAV_HEIGHT` + `FAB_OVERHANG`) so nothing scrolls underneath.
 * The FAB is 60px, rose, with a cream ring, and floats above the bar's centre.
 */
import {
  CalendarRange,
  History as HistoryIcon,
  House,
  Plus,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

export type NavTab = 'home' | 'plan' | 'history';

/** Height of the tab row, before the safe-area inset. */
export const BOTTOM_NAV_HEIGHT = 64;
/** How far the FAB rises above the bar. */
export const FAB_OVERHANG = 24;
/** Space a scrolling screen must leave at the bottom. */
export const BOTTOM_NAV_SPACE = BOTTOM_NAV_HEIGHT + FAB_OVERHANG + 16;

export interface BottomNavProps {
  active?: NavTab;
  onTabPress?: (tab: NavTab) => void;
  onAddPress?: () => void;
}

function TabItem({
  label,
  icon: Icon,
  active,
  onPress,
}: {
  label: string;
  icon: typeof House;
  active: boolean;
  onPress?: () => void;
}) {
  const tint = active ? colors['emerald-ink'] : colors['ink-muted'];

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <Icon size={22} color={tint} strokeWidth={active ? 2.2 : 1.8} />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts['sans-semibold'],
          fontSize: 11,
          lineHeight: 14,
          color: tint,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BottomNav({ active = 'home', onTabPress, onAddPress }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <View
        className="bg-surface"
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.line,
          paddingBottom: insets.bottom,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: BOTTOM_NAV_HEIGHT,
            paddingLeft: 16,
            paddingRight: 8,
          }}
        >
          <TabItem
            label="Home"
            icon={House}
            active={active === 'home'}
            onPress={() => onTabPress?.('home')}
          />
          <TabItem
            label="Our Plan"
            icon={CalendarRange}
            active={active === 'plan'}
            onPress={() => onTabPress?.('plan')}
          />
          <TabItem
            label="History"
            icon={HistoryIcon}
            active={active === 'history'}
            onPress={() => onTabPress?.('history')}
          />

          {/*
            The add button keeps its own slot instead of floating over a tab, so
            adding History does not cover the middle label. It still rises above
            the bar by ten pixels, and the screens' bottom padding already
            reserves that overhang.
          */}
          <View
            style={{
              width: 68,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add expense"
              onPress={onAddPress}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.rose,
                borderWidth: 4,
                borderColor: colors.cream,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateY: -10 }],
              }}
            >
              <Plus size={26} color={colors.surface} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

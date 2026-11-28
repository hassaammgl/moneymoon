/**
 * WriteErrorToast — one failed save, one sentence, above the bottom nav.
 *
 * Writes are optimistic, so when one fails the store has already rolled the
 * change back. This banner is the only thing that tells the user why the number
 * jumped back, and it stays until they dismiss it or make the next change.
 */
import { AlertCircle, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

export function WriteErrorToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + 96,
        paddingHorizontal: 20,
        alignItems: 'center',
      }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{
          width: '100%',
          maxWidth: 560,
          borderRadius: 18,
          backgroundColor: colors.ink,
          paddingLeft: 14,
          paddingRight: 6,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <AlertCircle size={18} color={colors['rose-soft']} strokeWidth={2} />

        <Text
          style={{
            flex: 1,
            fontFamily: fonts.sans,
            fontSize: 12.5,
            lineHeight: 18,
            color: colors.cream,
          }}
        >
          {message}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss error"
          hitSlop={6}
          onPress={onDismiss}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color={colors.cream} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

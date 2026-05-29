import {Pressable, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {TimesLarge_Stroke2_Corner0_Rounded as TimesIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

export function FollowersPromoBanner({
  onPress,
  onDismiss,
}: {
  onPress: () => void
  onDismiss: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  return (
    <View style={[a.px_lg, a.pt_md]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={l`Invite friends`}
        accessibilityHint={l`Opens the invite friends sheet to share your profile`}
        onPress={onPress}
        style={({pressed}) => [
          a.flex_row,
          a.align_center,
          a.w_full,
          {
            height: 80,
            borderRadius: 16,
            backgroundColor: t.palette.primary_50,
            paddingHorizontal: 16,
            paddingVertical: 16,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <View
          style={{
            width: 126,
            height: 64,
            marginRight: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <Text
          style={[
            a.flex_1,
            a.text_md,
            a.font_bold,
            {color: t.palette.primary_700, lineHeight: 19.5},
          ]}>
          {l`Import contacts or invite your friends`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`Dismiss`}
          accessibilityHint={l`Hides the invite friends promo banner`}
          onPress={onDismiss}
          hitSlop={12}
          style={({pressed}) => [
            {
              position: 'absolute',
              top: 8,
              right: 8,
              padding: 4,
              opacity: pressed ? 0.5 : 1,
            },
          ]}>
          <TimesIcon width={12} height={12} fill={t.palette.contrast_500} />
        </Pressable>
      </Pressable>
    </View>
  )
}

import {Pressable} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {JOIN_REQUESTS_THRESHOLD} from '#/state/queries/messages/list-join-requests'
import {atoms as a, tokens, useTheme} from '#/alf'
import {GlassView} from '#/components/GlassView'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {IS_LIQUID_GLASS} from '#/env'

export function RequestStatus({
  top,
  count,
  onDismiss,
  onPress,
}: {
  top: number
  count: number
  onDismiss: () => void
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(200)}
      exiting={FadeOut.duration(200)}
      style={[
        a.absolute,
        a.z_50,
        {
          top: top + (IS_LIQUID_GLASS ? tokens.space.sm : tokens.space.xl),
          left: tokens.space.xl,
          right: tokens.space.xl,
        },
      ]}>
      <GlassView
        style={[a.flex_1, a.rounded_full, a.flex_row, a.align_center]}
        isInteractive
        glassEffectStyle="regular"
        tintColor={t.palette.primary_50}
        fallbackStyle={{
          backgroundColor: t.palette.primary_50,
          borderWidth: 1,
          borderColor: t.palette.primary_100,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`View incoming requests`}
          accessibilityHint={l`View incoming requests to join this group chat`}
          hitSlop={HITSLOP_10}
          style={[a.flex_1, a.flex_row, a.align_center, a.p_lg]}
          onPress={onPress}>
          <EnvelopeIcon size="md" fill={t.palette.primary_500} />
          <Text
            style={[
              a.flex_1,
              a.ml_sm,
              a.text_sm,
              a.font_semi_bold,
              {color: t.palette.primary_500},
            ]}>
            {count > JOIN_REQUESTS_THRESHOLD
              ? l({
                  message: `${JOIN_REQUESTS_THRESHOLD}+ new join requests`,
                  comment:
                    'Displayed when the number of requests is greater than 20',
                })
              : plural(count, {
                  one: '# new join request',
                  other: '# new join requests',
                })}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`Close banner`}
          accessibilityHint={l`Close the incoming requests banner`}
          hitSlop={HITSLOP_10}
          onPress={onDismiss}
          style={[a.p_lg]}>
          <CloseIcon size="md" fill={t.palette.primary_500} />
        </Pressable>
      </GlassView>
    </Animated.View>
  )
}

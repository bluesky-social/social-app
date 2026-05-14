import {useEffect} from 'react'
import {Animated, Pressable} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'
import {UNREAD_LIMIT} from '#/state/queries/messages/list-conversations'
import {atoms as a, useTheme} from '#/alf'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

export function RequestStatus({
  top,
  count,
  more,
  onDismiss,
  onPress,
}: {
  top: number
  count: number
  more: boolean
  onDismiss: () => void
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const fadeAnim = useAnimatedValue(0)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      delay: 200,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  return (
    <Animated.View
      style={[
        a.absolute,
        a.z_50,
        a.mx_md,
        a.rounded_full,
        a.p_lg,
        {
          top: top + a.m_md.margin,
          backgroundColor: t.palette.primary_50,
          borderWidth: 1,
          borderColor: t.palette.primary_100,
          left: a.m_md.margin,
          right: a.m_md.margin,
          opacity: fadeAnim,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        hitSlop={HITSLOP_10}
        style={[a.flex_row, a.align_center, a.justify_between]}
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
          {count >= UNREAD_LIMIT && more
            ? l({
                message: `${count}+ new join requests`,
                comment:
                  'Displayed when the number of requests is greater than 20',
              })
            : plural(count, {
                one: '# new join request',
                other: '# new join requests',
              })}
        </Text>
        <Pressable accessibilityRole="button" onPress={onDismiss}>
          <CloseIcon size="md" fill={t.palette.primary_500} />
        </Pressable>
      </Pressable>
    </Animated.View>
  )
}

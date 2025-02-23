import {StyleProp, ViewStyle} from 'react-native'
import {View} from 'react-native'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/**
 * Absolutely positioned time indicator showing how many seconds are remaining
 * Time is in seconds
 */
export function TimeIndicator({
  time,
  style,
}: {
  time: number
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {_} = useLingui()

  if (isNaN(time)) {
    return null
  }

  const minutes = Math.floor(time / 60)
  const seconds = String(time % 60).padStart(2, '0')

  return (
    <View
      pointerEvents="none"
      accessibilityLabel={_(
        msg`Time remaining: ${plural(Number(time) || 0, {
          one: '# second',
          other: '# seconds',
        })}`,
      )}
      accessibilityHint=""
      style={[
        {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 3,
          left: 6,
          bottom: 6,
          minHeight: 21,
        },
        a.absolute,
        a.justify_center,
        style,
      ]}>
      <Text
        style={[
          {color: t.palette.white, fontSize: 12, fontVariant: ['tabular-nums']},
          a.font_bold,
          {lineHeight: 1.25},
        ]}>
        {`${minutes}:${seconds}`}
      </Text>
    </View>
  )
}

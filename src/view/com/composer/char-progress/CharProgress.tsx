import React from 'react'
import {StyleProp, TextStyle, View, ViewStyle} from 'react-native'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'

// @ts-ignore no type definition -prf
// import ProgressPie from 'react-native-progress/Pie'
import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {atoms as a} from '#/alf'

export function CharProgress({
  count,
  max,
  style,
  textStyle,
  size,
}: {
  count: number
  max?: number
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  size?: number
}) {
  const maxLength = max || MAX_GRAPHEME_LENGTH
  const pal = usePalette('default')
  const textColor = count > maxLength ? '#e60000' : pal.colors.text
  const circleColor = count > maxLength ? '#e60000' : pal.colors.link
  const remainingCount = maxLength - count
  const shouldShowText = remainingCount <= 20
  const shouldShowCircle = remainingCount > -10

  return (
    <View
      style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm, style]}>
      <ProgressCircle
        animated={false}
        size={size ?? 30}
        borderWidth={shouldShowCircle ? 1 : 0}
        borderColor={pal.colors.border}
        color={circleColor}
        progress={shouldShowCircle ? Math.min(count / maxLength, 1) : 0}
        showsText={shouldShowText}
        formatText={() => remainingCount}
        textStyle={[
          {
            color: textColor,
            fontVariant: ['tabular-nums'],
            fontSize: 14,
            fontWeight: 400,
          },
          a.text_right,
          textStyle,
        ]}
      />
    </View>
  )
}

import {
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'
// @ts-ignore no type definition -prf
import ProgressPie from 'react-native-progress/Pie'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

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
  const t = useTheme()
  const textColor = count > maxLength ? '#e60000' : t.atoms.text.color
  const circleColor = count > maxLength ? '#e60000' : t.palette.primary_500
  return (
    <View
      style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm, style]}>
      <Text
        style={[
          {color: textColor, fontVariant: ['tabular-nums']},
          a.flex_grow,
          a.text_right,
          textStyle,
        ]}
        maxFontSizeMultiplier={1}>
        {maxLength - count}
      </Text>
      {count > maxLength ? (
        <ProgressPie
          size={size ?? 30}
          borderWidth={4}
          borderColor={circleColor}
          color={circleColor}
          progress={Math.min((count - maxLength) / maxLength, 1)}
        />
      ) : (
        <ProgressCircle
          size={size ?? 30}
          borderWidth={1}
          borderColor={t.atoms.border_contrast_low.borderColor}
          color={circleColor}
          progress={count / maxLength}
        />
      )}
    </View>
  )
}

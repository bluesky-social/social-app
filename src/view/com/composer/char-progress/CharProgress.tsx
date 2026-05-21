import {
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {ProgressCircle} from '#/components/Progress'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

export function CharProgress({
  count,
  max = MAX_GRAPHEME_LENGTH,
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
  const t = useTheme()
  const textColor = count > max ? '#e60000' : t.atoms.text.color
  const circleColor = count > max ? '#e60000' : t.palette.primary_500

  //
  if (IS_WEB && count > max) {
    return (
      <View style={[style, {minHeight: size}]}>
        <Text
          style={[
            {color: textColor, fontVariant: ['tabular-nums']},
            a.text_center,
            a.text_xs,
            {maxWidth: '100%'},
            textStyle,
          ]}
          maxFontSizeMultiplier={1}
          numberOfLines={1}>
          {max - count}
        </Text>
      </View>
    )
  }

  return (
    <View style={[style]}>
      {max - count < 100 && (
        <View
          style={[
            a.absolute,
            a.inset_0,
            a.justify_center,
            a.align_center,
            a.px_xs,
          ]}>
          <Text
            style={[
              {color: textColor, fontVariant: ['tabular-nums']},
              a.text_center,
              a.text_xs,
              {maxWidth: '100%'},
              textStyle,
            ]}
            maxFontSizeMultiplier={1}
            adjustsFontSizeToFit
            numberOfLines={1}>
            {max - count}
          </Text>
        </View>
      )}
      <ProgressCircle
        size={size ?? 32}
        borderWidth={3}
        borderColor={t.palette.contrast_50}
        color={circleColor}
        progress={Math.min(count / max, 1)}
      />
    </View>
  )
}

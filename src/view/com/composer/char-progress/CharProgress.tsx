import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {atoms as a} from '#/alf'
import {Text} from '../../util/text/Text'

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
      style={[
        a.flex,
        a.align_center,
        a.justify_center,
        a.gap_sm,
        styles.container,
        style,
      ]}>
      {shouldShowCircle && (
        <Animated.View
          exiting={FadeOut.duration(200)}
          entering={FadeIn.duration(200)}
          style={styles.progressCircle}>
          <ProgressCircle
            animated={false}
            size={size ?? 30}
            borderWidth={0}
            unfilledColor={pal.colors.border}
            color={circleColor}
            progress={Math.min(count / maxLength, 1)}
          />
        </Animated.View>
      )}
      {shouldShowText && (
        <Text
          style={[{color: textColor, fontSize: 14}, a.text_right, textStyle]}>
          {remainingCount}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minWidth: 30,
    height: 30,
  },
  progressCircle: {
    position: 'absolute',
  },
})

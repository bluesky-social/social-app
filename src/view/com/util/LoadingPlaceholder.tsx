import React, {useEffect, useMemo} from 'react'
import {
  Animated,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {colors} from '../../lib/styles'

export function LoadingPlaceholder({
  width,
  height,
  style,
}: {
  width: string | number
  height: string | number
  style?: StyleProp<ViewStyle>
}) {
  const dim = useWindowDimensions()
  const elWidth = typeof width === 'string' ? dim.width : width
  const offset = useMemo(() => new Animated.Value(elWidth * -1), [])
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(offset, {
          toValue: elWidth,
          duration: 1e3,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(offset, {
          toValue: elWidth * -1,
          duration: 0,
          delay: 500,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: colors.gray2,
          borderRadius: 6,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View
        style={{
          width,
          height,
          transform: [{translateX: offset}],
        }}>
        <LinearGradient
          colors={[colors.gray2, '#d4d2d2', colors.gray2]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{width: '100%', height: '100%'}}
        />
      </Animated.View>
    </View>
  )
}

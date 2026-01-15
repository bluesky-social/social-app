import React from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Trans} from '@lingui/macro'

import {
  ScaleAndFadeIn,
  ScaleAndFadeOut,
} from '#/lib/custom-animations/ScaleAndFade'
import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_IOS, IS_WEB} from '#/env'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function NewMessagesPill({
  onPress: onPressInner,
}: {
  onPress: () => void
}) {
  const t = useTheme()
  const playHaptic = useHaptics()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const bottomBarHeight = IS_IOS ? 42 : IS_ANDROID ? 60 : 0
  const bottomOffset = IS_WEB ? 0 : bottomInset + bottomBarHeight

  const scale = useSharedValue(1)

  const onPressIn = React.useCallback(() => {
    if (IS_WEB) return
    scale.set(() => withTiming(1.075, {duration: 100}))
  }, [scale])

  const onPressOut = React.useCallback(() => {
    if (IS_WEB) return
    scale.set(() => withTiming(1, {duration: 100}))
  }, [scale])

  const onPress = React.useCallback(() => {
    runOnJS(playHaptic)()
    onPressInner?.()
  }, [onPressInner, playHaptic])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.get()}],
  }))

  return (
    <View
      style={[
        a.absolute,
        a.w_full,
        a.z_10,
        a.align_center,
        {
          bottom: bottomOffset + 70,
          // Don't prevent scrolling in this area _except_ for in the pill itself
          pointerEvents: 'box-none',
        },
      ]}>
      <AnimatedPressable
        style={[
          a.py_sm,
          a.rounded_full,
          a.shadow_sm,
          a.border,
          t.atoms.bg_contrast_50,
          t.atoms.border_contrast_medium,
          {
            width: 160,
            alignItems: 'center',
            shadowOpacity: 0.125,
            shadowRadius: 12,
            shadowOffset: {width: 0, height: 5},
            pointerEvents: 'box-only',
          },
          animatedStyle,
        ]}
        entering={ScaleAndFadeIn}
        exiting={ScaleAndFadeOut}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <Text style={[a.font_semi_bold]}>
          <Trans>New messages</Trans>
        </Text>
      </AnimatedPressable>
    </View>
  )
}

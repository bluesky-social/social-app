import React from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  ScaleAndFadeIn,
  ScaleAndFadeOut,
} from 'lib/custom-animations/ScaleAndFade'
import {useHaptics} from 'lib/haptics'
import {isAndroid, isIOS, isWeb} from 'platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

let lastIndex = 0

export function ChatEmpty() {
  const t = useTheme()
  const {_} = useLingui()
  const playHaptic = useHaptics()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const bottomBarHeight = isIOS ? 42 : isAndroid ? 60 : 0
  const bottomOffset = isWeb ? 0 : bottomInset + bottomBarHeight
  const [promptIndex, setPromptIndex] = React.useState(lastIndex)

  const scale = useSharedValue(1)

  const prompts = React.useMemo(() => {
    return [
      _(msg`Say hello!`),
      _(msg`Share your favorite feed!`),
      _(msg`Tell a joke!`),
      _(msg`Share a fun fact!`),
      _(msg`Share a cool story!`),
      _(msg`Send a neat website!`),
      _(msg`Clip 🐴 clop 🐴`),
    ]
  }, [_])

  const onPressIn = React.useCallback(() => {
    if (isWeb) return
    scale.value = withTiming(1.075, {duration: 100})
  }, [scale])

  const onPressOut = React.useCallback(() => {
    if (isWeb) return
    scale.value = withTiming(1, {duration: 100})
  }, [scale])

  const onPress = React.useCallback(() => {
    runOnJS(playHaptic)()
    let randomPromptIndex = Math.floor(Math.random() * prompts.length)
    while (randomPromptIndex === lastIndex) {
      randomPromptIndex = Math.floor(Math.random() * prompts.length)
    }
    setPromptIndex(randomPromptIndex)
    lastIndex = randomPromptIndex
  }, [playHaptic, prompts.length])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
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
          a.px_xl,
          a.py_md,
          a.rounded_full,
          t.atoms.bg_contrast_25,
          {
            alignItems: 'center',
            pointerEvents: 'box-only',
          },
          animatedStyle,
        ]}
        entering={ScaleAndFadeIn}
        exiting={ScaleAndFadeOut}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <Text style={[a.font_bold, a.pointer_events_none]} selectable={false}>
          {prompts[promptIndex]}
        </Text>
      </AnimatedPressable>
    </View>
  )
}

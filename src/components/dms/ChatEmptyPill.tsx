import {useCallback, useMemo, useState} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useLingui} from '@lingui/react/macro'

import {ScaleAndFadeIn} from '#/lib/custom-animations/ScaleAndFade'
import {ShrinkAndPop} from '#/lib/custom-animations/ShrinkAndPop'
import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

let lastIndex = 0

export function ChatEmptyPill() {
  const t = useTheme()
  const {t: l} = useLingui()
  const playHaptic = useHaptics()
  const [promptIndex, setPromptIndex] = useState(lastIndex)

  const scale = useSharedValue(1)

  const prompts = useMemo(() => {
    return [
      l`Say hello!`,
      l`Share your favorite feed!`,
      l`Tell a joke!`,
      l`Share a fun fact!`,
      l`Share a cool story!`,
      l`Send a neat website!`,
      l`Clip 🐴 clop 🐴`,
    ]
  }, [l])

  const onPressIn = useCallback(() => {
    if (IS_WEB) return
    scale.set(() => withTiming(1.075, {duration: 100}))
  }, [scale])

  const onPressOut = useCallback(() => {
    if (IS_WEB) return
    scale.set(() => withTiming(1, {duration: 100}))
  }, [scale])

  const onPress = useCallback(() => {
    runOnJS(playHaptic)()
    let randomPromptIndex = Math.floor(Math.random() * prompts.length)
    while (randomPromptIndex === lastIndex) {
      randomPromptIndex = Math.floor(Math.random() * prompts.length)
    }
    setPromptIndex(randomPromptIndex)
    lastIndex = randomPromptIndex
  }, [playHaptic, prompts.length])

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
          top: -50,
        },
      ]}>
      <AnimatedPressable
        style={[
          a.px_xl,
          a.py_md,
          a.rounded_full,
          t.atoms.bg_contrast_25,
          a.align_center,
          animatedStyle,
        ]}
        entering={ScaleAndFadeIn}
        exiting={ShrinkAndPop}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <Text
          style={[a.font_semi_bold, a.pointer_events_none]}
          selectable={false}
          emoji>
          {prompts[promptIndex]}
        </Text>
      </AnimatedPressable>
    </View>
  )
}

import React from 'react'
import Animated, {withTiming} from 'react-native-reanimated'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

function EnteringAnimation() {
  'worklet'

  const animations = {
    opacity: withTiming(1),
    transform: [{scale: withTiming(1)}],
  }

  const initialValues = {
    opacity: 0,
    transform: [{scale: 0.7}],
  }

  return {
    animations,
    initialValues,
  }
}

function ExitingAnimation() {
  const animations = {
    opacity: withTiming(0),
    transform: [{scale: withTiming(0.7)}],
  }

  const initialValues = {
    opacity: 1,
    transform: [{scale: 1}],
  }

  return {
    animations,
    initialValues,
  }
}

export function NewMessagesPill() {
  const t = useTheme()

  React.useEffect(() => {}, [])

  return (
    <Animated.View
      style={[a.py_xl, {width: 150, backgroundColor: t.palette.primary_500}]}
      entering={EnteringAnimation}
      exiting={ExitingAnimation}>
      <Text style={[a.text_md]}>New messages</Text>
    </Animated.View>
  )
}

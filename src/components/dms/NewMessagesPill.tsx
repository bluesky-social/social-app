import React from 'react'
import {View} from 'react-native'
import Animated, {withTiming} from 'react-native-reanimated'
import {Trans} from '@lingui/macro'

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
  'worklet'

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
      style={[
        a.py_md,
        a.rounded_full,
        a.shadow_sm,
        a.border,
        t.atoms.border_contrast_low,
        {
          position: 'absolute',
          bottom: 80,
          width: '50%',
          left: '25%',
          alignItems: 'center',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: {width: 0, height: 5},
          backgroundColor: t.palette.positive_700,
        },
      ]}
      entering={EnteringAnimation}
      exiting={ExitingAnimation}>
      <View style={{flex: 1}}>
        <Text style={[a.text_md, a.font_bold, {color: t.palette.white}]}>
          <Trans>New messages</Trans>
        </Text>
      </View>
    </Animated.View>
  )
}

import React from 'react'
import {View, ViewProps} from 'react-native'
import Animated from 'react-native-reanimated'

import {useTheme} from '#/alf'

export function InputContainer({style, ...props}: ViewProps) {
  const t = useTheme()
  return <Animated.View style={[t.atoms.bg, style]} {...props} />
}

export function InputPill({style, ...props}: ViewProps) {
  const t = useTheme()
  return <View style={[t.atoms.bg_contrast_25, style]} {...props} />
}

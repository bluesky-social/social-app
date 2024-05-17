import React from 'react'
import {View, ViewProps} from 'react-native'
import Animated from 'react-native-reanimated'
import {BlurView} from 'expo-blur'

import {atoms as a, useTheme} from '#/alf'

export function InputContainer({style, children, ...props}: ViewProps) {
  const t = useTheme()
  const lightMode = t.name === 'light'
  return (
    <Animated.View
      style={[t.atoms.border_contrast_high, a.border_t, style]}
      {...props}>
      <BlurView tint={lightMode ? 'systemMaterialLight' : 'systemMaterialDark'}>
        {children}
      </BlurView>
    </Animated.View>
  )
}

export function InputPill({style, children, ...props}: ViewProps) {
  const t = useTheme()
  const lightMode = t.name === 'light'
  return (
    <View style={style} {...props}>
      <BlurView
        style={[
          a.flex_row,
          {
            padding: a.p_sm.padding - 2,
            paddingLeft: a.p_md.padding - 2,
          },
        ]}
        tint={
          lightMode ? 'systemThickMaterialLight' : 'systemThickMaterialDark'
        }>
        {children}
      </BlurView>
    </View>
  )
}

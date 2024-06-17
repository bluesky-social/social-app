import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'

import {gradients} from '#/alf/tokens'

export function LinearGradientBackground({
  style,
  children,
}: {
  style: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const gradient = gradients.sky.values.map(([_, color]) => {
    return color
  })

  return (
    <LinearGradient colors={gradient} style={style}>
      {children}
    </LinearGradient>
  )
}

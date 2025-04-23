import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'

import {gradients} from '#/alf/tokens'

export function LinearGradientBackground({
  style,
  gradient = 'sky',
  children,
  start,
  end,
}: {
  style?: StyleProp<ViewStyle>
  gradient?: keyof typeof gradients
  children?: React.ReactNode
  start?: [number, number]
  end?: [number, number]
}) {
  const colors = gradients[gradient].values.map(([_, color]) => {
    return color
  }) as [string, string, ...string[]]

  if (gradient.length < 2) {
    throw new Error('Gradient must have at least 2 colors')
  }

  return (
    <LinearGradient colors={colors} style={style} start={start} end={end}>
      {children}
    </LinearGradient>
  )
}

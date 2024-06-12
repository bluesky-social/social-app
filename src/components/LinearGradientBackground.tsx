import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'

import {useTheme} from '#/alf'

export function LinearGradientBackground({
  style,
  children,
}: {
  style: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const t = useTheme()

  const gradient =
    t.name === 'light'
      ? [t.palette.primary_500, t.palette.primary_300]
      : [t.palette.primary_600, t.palette.primary_400]

  return (
    <LinearGradient colors={gradient} style={style}>
      {children}
    </LinearGradient>
  )
}

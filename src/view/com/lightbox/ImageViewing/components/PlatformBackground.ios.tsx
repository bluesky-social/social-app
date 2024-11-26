import React from 'react'
import {BlurView} from 'expo-blur'

import {ViewStyleProp} from '#/alf'

export function PlatformBackground({
  children,
  style,
}: ViewStyleProp & {children: React.ReactNode}) {
  return (
    <BlurView tint="systemThickMaterialDark" intensity={75} style={style}>
      {children}
    </BlurView>
  )
}

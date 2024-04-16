import React from 'react'
import {View} from 'react-native'
import {KeyboardStickyView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {isWeb} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'

export function KeyboardAccessory({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const {bottom} = useSafeAreaInsets()

  const style = [
    a.flex_row,
    {paddingVertical: 10},
    a.pl_lg,
    a.pr_xl,
    a.align_center,
    a.border_t,
    t.atoms.border_contrast_medium,
    t.atoms.bg,
  ]

  // todo: when iPad support is added, it should also not use the KeyboardStickyView
  if (isWeb) {
    return <View style={style}>{children}</View>
  }

  return (
    <KeyboardStickyView offset={{closed: -bottom}} style={style}>
      {children}
    </KeyboardStickyView>
  )
}

import React from 'react'
import {View} from 'react-native'
import {atoms as a, useTheme} from '#/alf'
import {ViewStyleProp} from '#/alf'

export function Divider({style}: ViewStyleProp) {
  const t = useTheme()

  return <View style={[a.w_full, a.border_t, t.atoms.border, style]} />
}

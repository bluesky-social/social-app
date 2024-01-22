import React from 'react'
import {View} from 'react-native'
import {atoms as a, useTheme} from '#/alf'

export function Divider() {
  const t = useTheme()

  return <View style={[a.w_full, a.border_t, t.atoms.border]} />
}

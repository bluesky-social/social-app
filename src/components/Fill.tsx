import React from 'react'
import {View} from 'react-native'

import {atoms as a, ViewStyleProp} from '#/alf'

export function Fill({
  children,
  style,
}: {children?: React.ReactNode} & ViewStyleProp) {
  return <View style={[a.absolute, a.inset_0, style]}>{children}</View>
}

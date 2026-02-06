import {View} from 'react-native'
import type React from 'react'

import {atoms as a, type ViewStyleProp} from '#/alf'

export function Fill({
  children,
  style,
}: {children?: React.ReactNode} & ViewStyleProp) {
  return <View style={[a.absolute, a.inset_0, style]}>{children}</View>
}

import React from 'react'
import {View} from 'react-native'

import {ViewStyleProp} from '#/alf'

/**
 * Provides a view with a semi-transparent on Android/web, and a BlurView on iOS.
 */
export function PlatformBackground({
  children,
  style,
}: ViewStyleProp & {children: React.ReactNode}) {
  return <View style={[{backgroundColor: '#000d'}, style]}>{children}</View>
}

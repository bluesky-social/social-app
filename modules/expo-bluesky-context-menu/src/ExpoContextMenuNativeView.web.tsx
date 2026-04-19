import {View} from 'react-native'

import {type NativeViewProps} from './types'

/**
 * Web fallback: passthrough. Long-press is a no-op; tap handling is delegated
 * to children.
 */
export default function NativeView({children, style}: NativeViewProps) {
  return <View style={style}>{children}</View>
}

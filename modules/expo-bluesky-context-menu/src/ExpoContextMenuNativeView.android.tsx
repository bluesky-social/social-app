import {View} from 'react-native'

import {type NativeViewProps} from './types'

/**
 * Android fallback: passthrough for now. Follow-up: wire the existing
 * `#/components/Menu` on long-press.
 */
export default function NativeView({children, style}: NativeViewProps) {
  return <View style={style}>{children}</View>
}

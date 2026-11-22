import {View} from 'react-native'

import {
  type ZoomTransitionEnablerProps,
  type ZoomTransitionSourceProps,
} from './types'

/**
 * The zoom transition is iOS 26+ only. Elsewhere the source is a plain View
 * and the screen uses its normal transition.
 */
export function Source({
  identifier: _identifier,
  ...props
}: ZoomTransitionSourceProps) {
  return <View {...props} />
}

export function Enabler(_props: ZoomTransitionEnablerProps) {
  return null
}

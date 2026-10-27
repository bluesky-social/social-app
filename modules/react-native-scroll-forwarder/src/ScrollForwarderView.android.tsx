import {UIManager} from 'react-native'

import {
  default as NativeScrollForwarderView,
  type NativeProps,
} from './ScrollForwarderViewNativeComponent'

/** Older binaries may receive this JavaScript bundle before the native view. */
export const isScrollForwarderAvailable = UIManager.hasViewManagerConfig(
  'ScrollForwarderView',
)

export function ScrollForwarderView({children, ...rest}: NativeProps) {
  if (!isScrollForwarderAvailable) return children

  // Empty header space must fall through to the pager beneath the overlay.
  return (
    <NativeScrollForwarderView {...rest} pointerEvents="box-none">
      {children}
    </NativeScrollForwarderView>
  )
}

import {
  default as NativeScrollForwarderView,
  type NativeProps,
} from './ScrollForwarderViewNativeComponent'

export function ScrollForwarderView({children, ...rest}: NativeProps) {
  // Empty header space must fall through to the pager beneath the overlay.
  return (
    <NativeScrollForwarderView {...rest} pointerEvents="box-none">
      {children}
    </NativeScrollForwarderView>
  )
}

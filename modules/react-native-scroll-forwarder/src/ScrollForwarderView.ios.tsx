import {
  default as NativeScrollForwarderView,
  NativeProps,
} from './ScrollForwarderViewNativeComponent'

export function ScrollForwarderView({children, ...rest}: NativeProps) {
  return (
    <NativeScrollForwarderView {...rest}>{children}</NativeScrollForwarderView>
  )
}

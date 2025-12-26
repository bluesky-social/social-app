import {
  default as NativeScrollForwarderView,
  type NativeProps,
} from './ScrollForwarderViewNativeComponent'

export function ScrollForwarderView({children, ...rest}: NativeProps) {
  return (
    <NativeScrollForwarderView {...rest} style={{flex: 1}}>
      {children}
    </NativeScrollForwarderView>
  )
}

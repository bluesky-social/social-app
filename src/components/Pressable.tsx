import {
  Pressable as NativePressable,
  type PressableStateCallbackType as NativePressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

export interface PressableStateCallbackType extends NativePressableStateCallbackType {
  /** Provided by react-native-web. */
  readonly focused?: boolean
  /** Provided by react-native-web. */
  readonly hovered?: boolean
}

export type PressableProps = Omit<
  React.ComponentProps<typeof NativePressable>,
  'children' | 'style'
> & {
  children?:
    React.ReactNode | ((state: PressableStateCallbackType) => React.ReactNode)
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)
}

/**
 * React Native Pressable with react-native-web's callback state represented in
 * its types. The web-only fields are optional because native does not provide
 * them at runtime.
 */
export function Pressable({children, style, ...props}: PressableProps) {
  return (
    <NativePressable {...props} style={style}>
      {children}
    </NativePressable>
  )
}

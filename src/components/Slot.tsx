/*
 * Children for Radix's `asChild`. Radix's Slot merges the child's `style` into
 * its own with an object spread, which mangles React Native style arrays, so
 * callers used to flatten them. A flattened style is a new object, which on
 * web costs every atom its CSS class and drops `hover()` styles.
 *
 * These take the style array as `rnStyle` instead, out of the Slot's reach,
 * and combine it with whatever `style` Radix passes down.
 */
import {
  Pressable,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import {Text} from '#/components/Typography'

export function SlotView({
  rnStyle,
  style,
  ...props
}: React.ComponentProps<typeof View> & {rnStyle?: StyleProp<ViewStyle>}) {
  return <View {...props} style={[rnStyle, style]} />
}

export function SlotPressable({
  rnStyle,
  style,
  ...props
}: Omit<React.ComponentProps<typeof Pressable>, 'style'> & {
  rnStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
}) {
  return <Pressable {...props} style={[rnStyle, style]} />
}

export function SlotText({
  rnStyle,
  style,
  ...props
}: React.ComponentProps<typeof Text> & {rnStyle?: StyleProp<TextStyle>}) {
  return <Text {...props} style={[rnStyle, style]} />
}

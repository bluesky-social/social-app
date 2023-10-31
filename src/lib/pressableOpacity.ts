// Note: This logic is taken from dilemma2/app/utils/pressableOpacity.ts

// A simple replacement for <TouchableOpacity> using <Pressable>
// You should be able to drop-in replace something like:
//   <TouchableOpacity ... style={someStyle}>...</TouchableOpacity>
// with:
//   <Pressable ... style={pressableOpacity(someStyle)}>...</Pressable>

import {PressableStateCallbackType, StyleProp, ViewStyle} from 'react-native'

const PRESSED_OPACITY = 0.2

export type StyleSelectionFunction = ({
  pressed,
}: PressableStateCallbackType) => StyleProp<ViewStyle>

export const pressableOpacity = (
  style: StyleProp<ViewStyle>,
): StyleSelectionFunction => {
  return ({pressed}: PressableStateCallbackType) =>
    pressed ? [style, {opacity: PRESSED_OPACITY}] : style
}

import {type PressableProps, View} from 'react-native'

/**
 * Stands in for `Button`'s `Pressable` in a ghost, keeping its styles and
 * children so the layout matches without rendering anything interactive.
 * Cards render a ghost copy of their actions inside their own pressable to
 * reserve space, and overlay the real actions on it, since interactive
 * elements can't nest.
 */
export function GhostPressable({style, children}: PressableProps) {
  return (
    <View style={typeof style === 'function' ? undefined : style}>
      {typeof children === 'function' ? null : children}
    </View>
  )
}

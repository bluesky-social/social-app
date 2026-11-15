import {type GestureResponderEvent, type View} from 'react-native'

import {getNativeViewTag} from '#/components/Dialog/sourceViewTag'

/**
 * Resolve the Menu trigger's host view across Paper/Fabric event shapes.
 */
export function getMenuSourceViewTag(
  trigger: React.ComponentRef<typeof View> | null,
  event?: GestureResponderEvent,
): number | undefined {
  return (
    getNativeViewTag(trigger) ??
    getNativeViewTag(event?.currentTarget) ??
    getNativeViewTag(event?.target) ??
    getNativeViewTag(event?.nativeEvent?.target)
  )
}

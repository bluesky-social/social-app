import {useContext} from 'react'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {GestureDetector, useNativeGesture} from 'react-native-gesture-handler'

/**
 * BlockDrawerGesture must wrap the ScrollView directly - the native gesture
 * only works when attached to the natively scrollable view. On the new
 * arch (Android), attaching it to a wrapper view breaks scrolling.
 */
export function BlockDrawerGesture({children}: {children: React.ReactNode}) {
  const drawerGesture = useContext(DrawerGestureContext)
  const scrollGesture = useNativeGesture({
    shouldCancelWhenOutside: false, // Android native-view gestures default to true
    block: drawerGesture,
  })
  return <GestureDetector gesture={scrollGesture}>{children}</GestureDetector>
}

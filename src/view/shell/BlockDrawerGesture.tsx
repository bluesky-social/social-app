import {useContext} from 'react'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'

export function BlockDrawerGesture({children}: {children: React.ReactNode}) {
  const drawerGesture = useContext(DrawerGestureContext) ?? Gesture.Native() // noop for web
  const scrollGesture = Gesture.Native().blocksExternalGesture(drawerGesture)
  return <GestureDetector gesture={scrollGesture}>{children}</GestureDetector>
}

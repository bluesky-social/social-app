import {useContext} from 'react'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'

export function BlockDrawerGesture({children}: {children: React.ReactNode}) {
  const drawerGesture = useContext(DrawerGestureContext) ?? Gesture.Native() // noop for web
  let scrollGesture = Gesture.Native()
    .shouldCancelWhenOutside(false) // for some reason defaults to true on Android
    .blocksExternalGesture(drawerGesture)
  return <GestureDetector gesture={scrollGesture}>{children}</GestureDetector>
}

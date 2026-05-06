import {GestureDetector} from 'react-native-gesture-handler'

import {useRegisterDrawerWaitGesture} from './DrawerWaitGestureContext'

/*
 * Registers a Gesture.Native() with the shell drawer so the drawer's pan
 * gesture must wait for it to fail before activating. Wrap a horizontal-swipe
 * surface (like the image carousel) where the drawer would otherwise race
 * the inner scroll on Android. See APP-2119.
 */
export function DrawerWaitGesture({children}: {children: React.ReactNode}) {
  const gesture = useRegisterDrawerWaitGesture()
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>
}

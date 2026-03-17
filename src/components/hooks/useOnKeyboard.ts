import {useEffect} from 'react'
import {
  Keyboard,
  type KeyboardEventListener,
  type KeyboardEventName,
} from 'react-native'

export function useOnKeyboard(
  eventName: KeyboardEventName,
  cb: KeyboardEventListener,
) {
  useEffect(() => {
    const subscription = Keyboard.addListener(eventName, cb)

    return () => {
      subscription.remove()
    }
  }, [eventName, cb])
}

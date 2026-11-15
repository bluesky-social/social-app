import {useEffect} from 'react'
import {
  Keyboard,
  type KeyboardEvent,
  type KeyboardEventName,
} from 'react-native'

export function useOnKeyboard(
  eventName: KeyboardEventName,
  cb: (event: KeyboardEvent) => unknown,
) {
  useEffect(() => {
    const subscription = Keyboard.addListener(eventName, cb)

    return () => {
      subscription.remove()
    }
  }, [eventName, cb])
}

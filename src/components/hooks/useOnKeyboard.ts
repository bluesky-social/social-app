import {useEffect} from 'react'
import {Keyboard} from 'react-native'

export function useOnKeyboardDidShow(cb: () => unknown) {
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', cb)

    return () => {
      subscription.remove()
    }
  }, [cb])
}

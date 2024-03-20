import React from 'react'
import {Keyboard} from 'react-native'

export function useOnKeyboardDidShow(cb: () => unknown) {
  React.useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', cb)

    return () => {
      subscription.remove()
    }
  }, [cb])
}

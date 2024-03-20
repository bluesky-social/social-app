import React from 'react'
import {Keyboard} from 'react-native'
import {isAndroid} from 'platform/detection'

export function useOnKeyboardDidShow(cb: () => unknown) {
  React.useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      // Because this happens immediately on Android, we need to delay it
      if (isAndroid) {
        setTimeout(cb, 100)
      } else {
        cb()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [cb])
}

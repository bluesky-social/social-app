import React from 'react'
import {FlatList, Keyboard} from 'react-native'

export function useScrollToEndOnFocus(flatListRef: React.RefObject<FlatList>) {
  React.useEffect(() => {
    const listener = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({animated: true})
      })
    })

    return () => {
      listener.remove()
    }
  }, [flatListRef])
}

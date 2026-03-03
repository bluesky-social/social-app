import React from 'react'
import {type TextInput as RNTextInput} from 'react-native'
import {type TextInput} from 'react-native-gesture-handler'

import {shouldIgnore} from '../keyboard-shortcuts'

export function useFocusSearchInputKeyboardShortcut(
  isSearchActive: boolean,
  inputRef: React.RefObject<(TextInput | RNTextInput) | null>,
) {
  React.useEffect(() => {
    if (isSearchActive) return

    function handler(event: KeyboardEvent) {
      if (shouldIgnore(event) || !inputRef.current) return
      event.preventDefault()
      if (event.key === '/') {
        inputRef.current.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isSearchActive, inputRef])
}

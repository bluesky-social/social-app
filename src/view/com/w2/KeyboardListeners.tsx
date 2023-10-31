import React, {ReactNode, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {Keyboard, KeyboardEvent} from 'react-native'

interface Props {
  onKeyboardWillShow?: (event: KeyboardEvent) => void
  onKeyboardDidShow?: (event: KeyboardEvent) => void
  onKeyboardWillHide?: (event: KeyboardEvent) => void
  onKeyboardDidHide?: (event: KeyboardEvent) => void
  onKeyboardWillChangeFrame?: (event: KeyboardEvent) => void
  onKeyboardDidChangeFrame?: (event: KeyboardEvent) => void
  children?: ReactNode
}

// WillChangeFrame
// WillShow
// DidChangeFrame
// DidShow

// WillChangeFrame
// WillHide
// DidChangeFrame
// DidHide
export const KeyboardListeners = observer(function KeybordResizer({
  onKeyboardWillShow,
  onKeyboardDidShow,
  onKeyboardWillHide,
  onKeyboardDidHide,
  onKeyboardWillChangeFrame,
  onKeyboardDidChangeFrame,
  children,
}: Props) {
  useEffect(() => {
    const keyboardWillShowSub = onKeyboardWillShow
      ? Keyboard.addListener('keyboardWillShow', onKeyboardWillShow)
      : undefined

    const keyboardDidShowSub = onKeyboardDidShow
      ? Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
      : undefined

    const keyboardWillHideSub = onKeyboardWillHide
      ? Keyboard.addListener('keyboardWillHide', onKeyboardWillHide)
      : undefined

    const keyboardDidHideSub = onKeyboardDidHide
      ? Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)
      : undefined

    const keyboardWillChangeFrameSub = onKeyboardWillChangeFrame
      ? Keyboard.addListener(
          'keyboardWillChangeFrame',
          onKeyboardWillChangeFrame,
        )
      : undefined

    const keyboardDidChangeFrameSub = onKeyboardDidChangeFrame
      ? Keyboard.addListener('keyboardDidChangeFrame', onKeyboardDidChangeFrame)
      : undefined

    const cleanup = () => {
      keyboardWillShowSub?.remove()
      keyboardDidShowSub?.remove()
      keyboardWillHideSub?.remove()
      keyboardDidHideSub?.remove()
      keyboardWillChangeFrameSub?.remove()
      keyboardDidChangeFrameSub?.remove()
    }
    return cleanup
  }, [
    onKeyboardDidChangeFrame,
    onKeyboardDidHide,
    onKeyboardDidShow,
    onKeyboardWillChangeFrame,
    onKeyboardWillHide,
    onKeyboardWillShow,
  ])

  return <>{children}</>
})

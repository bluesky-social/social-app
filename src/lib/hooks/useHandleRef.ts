import {useState} from 'react'

export type HandleRef = {
  (node: any): void
  current: null | number
}

// This is a lighterweight alternative to `useAnimatedRef()` for imperative UI thread actions.
// Render it like <View ref={ref} />, then pass `ref.current` to `measureHandle()` and such.
export function useHandleRef(): HandleRef {
  return useState(() => {
    const ref = (node: any) => {
      if (node) {
        ref.current =
          node._nativeTag ??
          node.__nativeTag ??
          node.canonical?.nativeTag ??
          null
      } else {
        ref.current = null
      }
    }
    ref.current = null
    return ref
  })[0] as HandleRef
}

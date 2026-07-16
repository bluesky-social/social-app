import {useMemo} from 'react'

import {type FeedKeyboardNavOptions, type FeedKeyboardNavResult} from './types'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

const noop = (_scope: string) => {}

export function useHotkeysContext() {
  return useMemo(
    () => ({
      enableScope: noop,
      disableScope: noop,
    }),
    [],
  )
}

export function useFeedKeyboardNav(
  _options: FeedKeyboardNavOptions,
): FeedKeyboardNavResult {
  return {
    focusedIndex: -1,
    setFocusedIndex: () => -1,
    itemRef: () => () => {},
    itemActivation: () => () => noop,
  }
}

import {useMemo} from 'react'

import {type FeedKeyboardNavOptions, type FeedKeyboardNavResult} from './types'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

const noop = () => {}
const noopScope = (_scope: string) => {}

export function useHotkeysContext() {
  return useMemo(
    () => ({
      enableScope: noopScope,
      disableScope: noopScope,
    }),
    [],
  )
}

export function useFeedKeyboardNav(
  _options: FeedKeyboardNavOptions,
): FeedKeyboardNavResult {
  return {
    focusedIndex: -1,
    setFocusedIndex: noop,
    itemRef: _index => _el => {},
    itemActivation: _index => _activate => noop,
  }
}

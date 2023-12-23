import React, {createContext, useContext, useMemo} from 'react'
import {ScrollHandler} from 'react-native-reanimated'
import {NativeScrollEvent} from 'react-native'

type ScrollHandlers = {
  onBeginDrag: undefined | ScrollHandler
  onEndDrag: undefined | ScrollHandler<any>
  onScroll: undefined | ScrollHandler<any>
  onScrollEndWeb:
    | undefined
    | ((e: Pick<NativeScrollEvent, 'contentOffset'>) => void) // Web-only.
}

const ScrollContext = createContext<ScrollHandlers>({
  onBeginDrag: undefined,
  onEndDrag: undefined,
  onScroll: undefined,
  onScrollEndWeb: undefined,
})

export function useScrollHandlers(): ScrollHandlers {
  return useContext(ScrollContext)
}

type ProviderProps = {children: React.ReactNode} & ScrollHandlers

// Note: this completely *overrides* the parent handlers.
// It's up to you to compose them with the parent ones via useScrollHandlers() if needed.
export function ScrollProvider({
  children,
  onBeginDrag,
  onEndDrag,
  onScroll,
  onScrollEndWeb,
}: ProviderProps) {
  const handlers = useMemo(
    () => ({
      onBeginDrag,
      onEndDrag,
      onScroll,
      onScrollEndWeb,
    }),
    [onBeginDrag, onEndDrag, onScroll, onScrollEndWeb],
  )
  return (
    <ScrollContext.Provider value={handlers}>{children}</ScrollContext.Provider>
  )
}

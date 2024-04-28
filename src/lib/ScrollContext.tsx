import React, {createContext, useContext, useMemo} from 'react'
import {ScrollHandlers} from 'react-native-reanimated'

const ScrollContext = createContext<ScrollHandlers<any>>({
  onBeginDrag: undefined,
  onEndDrag: undefined,
  onScroll: undefined,
  onMomentumEnd: undefined,
})

export function useScrollHandlers(): ScrollHandlers<any> {
  return useContext(ScrollContext)
}

type ProviderProps = {children: React.ReactNode} & ScrollHandlers<any>

// Note: this completely *overrides* the parent handlers.
// It's up to you to compose them with the parent ones via useScrollHandlers() if needed.
export function ScrollProvider({
  children,
  onBeginDrag,
  onEndDrag,
  onScroll,
  onMomentumEnd,
}: ProviderProps) {
  const handlers = useMemo(
    () => ({
      onBeginDrag,
      onEndDrag,
      onScroll,
      onMomentumEnd,
    }),
    [onBeginDrag, onEndDrag, onScroll, onMomentumEnd],
  )
  return (
    <ScrollContext.Provider value={handlers}>{children}</ScrollContext.Provider>
  )
}

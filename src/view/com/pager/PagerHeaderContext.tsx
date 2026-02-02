import React, {useContext} from 'react'
import {type SharedValue} from 'react-native-reanimated'

import {IS_NATIVE} from '#/env'

export const PagerHeaderContext = React.createContext<{
  scrollY: SharedValue<number>
  headerHeight: number
} | null>(null)
PagerHeaderContext.displayName = 'PagerHeaderContext'

/**
 * Passes information about the scroll position and header height down via
 * context for the pager header to consume.
 *
 * @platform ios, android
 */
export function PagerHeaderProvider({
  scrollY,
  headerHeight,
  children,
}: {
  scrollY: SharedValue<number>
  headerHeight: number
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({scrollY, headerHeight}),
    [scrollY, headerHeight],
  )
  return (
    <PagerHeaderContext.Provider value={value}>
      {children}
    </PagerHeaderContext.Provider>
  )
}

export function usePagerHeaderContext() {
  const ctx = useContext(PagerHeaderContext)
  if (IS_NATIVE) {
    if (!ctx) {
      throw new Error(
        'usePagerHeaderContext must be used within a HeaderProvider',
      )
    }
    return ctx
  } else {
    return null
  }
}

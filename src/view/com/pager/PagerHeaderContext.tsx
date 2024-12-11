import React, {useContext} from 'react'
import {SharedValue} from 'react-native-reanimated'

import {isNative} from '#/platform/detection'

export const PagerHeaderContext = React.createContext<{
  scrollY: SharedValue<number>
  headerHeight: number
  minimumHeaderHeight: number
} | null>(null)

/**
 * Passes information about the scroll position and header height down via
 * context for the pager header to consume.
 *
 * @platform ios, android
 */
export function PagerHeaderProvider({
  scrollY,
  headerHeight,
  minimumHeaderHeight,
  children,
}: {
  scrollY: SharedValue<number>
  headerHeight: number
  minimumHeaderHeight: number
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({scrollY, headerHeight, minimumHeaderHeight}),
    [scrollY, headerHeight, minimumHeaderHeight],
  )
  return (
    <PagerHeaderContext.Provider value={value}>
      {children}
    </PagerHeaderContext.Provider>
  )
}

export function usePagerHeaderContext() {
  const ctx = useContext(PagerHeaderContext)
  if (isNative) {
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

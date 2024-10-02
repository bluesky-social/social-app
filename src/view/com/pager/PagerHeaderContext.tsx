import React, {useContext, useMemo} from 'react'
import {SharedValue} from 'react-native-reanimated'

import {isNative} from '#/platform/detection'

export const PagerHeaderContext = React.createContext<{
  scrollY: SharedValue<number>
  headerHeight: number
  tabBarHeight: number
} | null>(null)

/**
 * Passes the scrollY value to the pager header's banner, so it can grow on
 * overscroll on iOS, and handle the status bar. Not necessary to use this context provider on web.
 *
 * @platform ios, android
 */
export function PagerHeaderProvider({
  scrollY,
  children,
  headerHeight,
  tabBarHeight,
}: {
  scrollY: SharedValue<number>
  headerHeight: number
  tabBarHeight: number
  children: React.ReactNode
}) {
  const value = useMemo(
    () => ({scrollY, headerHeight, tabBarHeight}),
    [scrollY, headerHeight, tabBarHeight],
  )
  return (
    <PagerHeaderContext.Provider value={value}>
      {children}
    </PagerHeaderContext.Provider>
  )
}

export function usePagerHeaderContext() {
  const context = useContext(PagerHeaderContext)
  if (isNative) {
    if (!context) {
      throw new Error(
        'usePagerHeaderContext must be used within a HeaderProvider',
      )
    }
    return context
  } else {
    return null
  }
}

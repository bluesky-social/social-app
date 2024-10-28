import React, {useContext} from 'react'
import {SharedValue} from 'react-native-reanimated'

import {isIOS} from '#/platform/detection'

export const PagerHeaderContext =
  React.createContext<SharedValue<number> | null>(null)

/**
 * Passes the scrollY value to the pager header's banner, so it can grow on
 * overscroll on iOS. Not necessary to use this context provider on other platforms.
 *
 * @platform ios
 */
export function PagerHeaderProvider({
  scrollY,
  children,
}: {
  scrollY: SharedValue<number>
  children: React.ReactNode
}) {
  return (
    <PagerHeaderContext.Provider value={scrollY}>
      {children}
    </PagerHeaderContext.Provider>
  )
}

export function usePagerHeaderContext() {
  const scrollY = useContext(PagerHeaderContext)
  if (isIOS) {
    if (!scrollY) {
      throw new Error(
        'usePagerHeaderContext must be used within a HeaderProvider',
      )
    }
    return {scrollY}
  } else {
    return null
  }
}

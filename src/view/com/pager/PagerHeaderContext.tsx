import {createContext, useContext, useMemo} from 'react'
import {type SharedValue, useDerivedValue} from 'react-native-reanimated'

import {isNative} from '#/platform/detection'

export const PagerHeaderContext = createContext<{
  scrollY: SharedValue<number>
  clampedScrollY: SharedValue<number>
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
  // bit of a hackfix - most of the usage of scrollY here is for the pull-to-refresh
  // behaviour in the header, and after scrolling it's not needed anymore.
  // to improve performance, we create a derived value that clamps up-front,
  // therefore removing the need for the downstream animated styles to run on every frame
  // when they won't actually be used -sfn
  const clampedScrollY = useDerivedValue(() => Math.min(100, scrollY.get()))

  const value = useMemo(
    () => ({scrollY, clampedScrollY, headerHeight}),
    [scrollY, headerHeight, clampedScrollY],
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

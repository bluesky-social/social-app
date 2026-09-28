import {createContext, useContext, useMemo} from 'react'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'

import {IS_NATIVE} from '#/env'

export const PagerHeaderContext = createContext<{
  /** The focused page's scroll offset. */
  scrollY: SharedValue<number>
  /** Height of the header above the tab bar, which is what collapses. */
  headerHeight: number
  /** How much of the header above the tab bar stays on screen regardless. */
  minimumHeaderHeight: SharedValue<number>
  /** Whether the header follows a rubber band past the top of the list. */
  allowHeaderOverScroll: boolean
} | null>(null)
PagerHeaderContext.displayName = 'PagerHeaderContext'

/**
 * Passes information about the scroll position and header geometry down via
 * context, for the pager header and for anything the pages hang beneath it,
 * such as the new posts pill. `PagerWithHeader` wraps the whole pager in it,
 * not just the header.
 *
 * @platform ios, android
 */
export function PagerHeaderProvider({
  scrollY,
  headerHeight,
  minimumHeaderHeight,
  allowHeaderOverScroll = false,
  children,
}: {
  scrollY: SharedValue<number>
  headerHeight: number
  minimumHeaderHeight?: SharedValue<number>
  allowHeaderOverScroll?: boolean
  children: React.ReactNode
}) {
  const noMinimumHeaderHeight = useSharedValue(0)
  const minimum = minimumHeaderHeight ?? noMinimumHeaderHeight
  const value = useMemo(
    () => ({
      scrollY,
      headerHeight,
      minimumHeaderHeight: minimum,
      allowHeaderOverScroll,
    }),
    [scrollY, headerHeight, minimum, allowHeaderOverScroll],
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

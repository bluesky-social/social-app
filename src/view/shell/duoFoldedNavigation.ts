import {createContext, useContext, useSyncExternalStore} from 'react'
import {Dimensions, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {BREAKPOINTS} from '#/alf/breakpoints.shared'
import {IS_IOS} from '#/env'

export const DUO_NAV_RAIL_WIDTH = 64

/** True only while the signed-in folded rail occupies the screen edge. */
export const DuoRightRailContext = createContext(false)

/** Distinguish the outer display in either orientation from the inner display. */
export function isDuoFoldedDisplay(width: number, height: number) {
  return width > 0 && height > 0 && Math.max(width, height) < BREAKPOINTS.mobile
}

function subscribe(onChange: () => void) {
  const subscription = Dimensions.addEventListener('change', onChange)
  return () => subscription.remove()
}

function getSnapshot() {
  const {width, height} = Dimensions.get('screen')
  return (
    IS_IOS &&
    process.env.EXPO_PUBLIC_DUO_FOLDED_RIGHT_NAV === '1' &&
    isDuoFoldedDisplay(width, height)
  )
}

/** Screen geometry keeps keyboard changes from moving the navigation rail. */
export function useDuoFoldedNavigation() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Keep toolbars beside the outer display's trailing status cluster. */
export function getDuoCompactHeaderLayout({
  enabled,
  width,
  height,
  topInset,
  rightInset = 0,
  railWidth = DUO_NAV_RAIL_WIDTH,
}: {
  enabled: boolean
  width: number
  height: number
  topInset: number
  rightInset?: number
  railWidth?: number
}) {
  if (!enabled || height <= width || topInset <= 48) return null
  /** The active-call/live-activity capsule shifts the clock farther left. */
  const statusWidth = Math.min(250, width * 0.54)
  return {
    topPadding: topInset - 48,
    headerHeight: 48,
    headerRightPadding: Math.max(0, statusWidth - railWidth - rightInset),
  }
}

export function useDuoCompactHeader({
  fullWidth = false,
}: {fullWidth?: boolean} = {}) {
  const rightRail = useContext(DuoRightRailContext)
  const folded = useDuoFoldedNavigation()
  const enabled = fullWidth ? folded : rightRail
  const {width, height} = useWindowDimensions()
  const insets = useSafeAreaInsets()
  return getDuoCompactHeaderLayout({
    enabled,
    width,
    // Keep portrait headers stable while the keyboard reduces the window height.
    height: Math.max(height, Dimensions.get('screen').height),
    topInset: insets.top,
    rightInset: fullWidth ? 0 : insets.right,
    railWidth: fullWidth ? 0 : DUO_NAV_RAIL_WIDTH,
  })
}

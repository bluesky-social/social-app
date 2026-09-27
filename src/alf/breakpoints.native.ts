import {useContext, useSyncExternalStore} from 'react'
import {Dimensions} from 'react-native'

import {
  BreakpointWidthContext,
  getBreakpoints,
  getLayoutBreakpoints,
} from '#/alf/breakpoints.shared'
import {IS_IPAD} from '#/env'

export {type Breakpoint, BreakpointWidthContext} from '#/alf/breakpoints.shared'

function subscribeToWindowWidth(onChange: () => void) {
  // Other native devices keep their existing, non-responsive layout.
  if (!IS_IPAD) return () => {}

  const subscription = Dimensions.addEventListener('change', onChange)
  return () => subscription.remove()
}

function getWindowWidth() {
  return IS_IPAD ? Dimensions.get('window').width : 0
}

function useResponsiveWidth() {
  // A height-only change (for example the keyboard) is not a breakpoint change.
  const width = useSyncExternalStore(
    subscribeToWindowWidth,
    getWindowWidth,
    getWindowWidth,
  )
  const containerWidth = useContext(BreakpointWidthContext)

  // Phones retain their compact layout, including in landscape.
  return IS_IPAD ? (containerWidth ?? width) : 0
}

export function useBreakpoints() {
  return getBreakpoints(useResponsiveWidth())
}

export function useLayoutBreakpoints() {
  const breakpoints = getLayoutBreakpoints(useResponsiveWidth())
  return {
    ...breakpoints,
    // Native has no right rail, so its feed modules must stay in the feed.
    rightNavVisible: false,
    // Unlike web, there is no right rail to offset the centered column for.
    centerColumnOffset: false,
  }
}

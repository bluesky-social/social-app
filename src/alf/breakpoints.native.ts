import {useContext, useSyncExternalStore} from 'react'
import {Dimensions} from 'react-native'

import {
  BreakpointWidthContext,
  getBreakpoints,
  getLayoutBreakpoints,
} from '#/alf/breakpoints.shared'

export {type Breakpoint, BreakpointWidthContext} from '#/alf/breakpoints.shared'

function subscribeToWindowWidth(onChange: () => void) {
  const subscription = Dimensions.addEventListener('change', onChange)
  return () => subscription.remove()
}

function getWindowWidth() {
  return Dimensions.get('window').width
}

function useResponsiveWidth() {
  // A height-only change (for example the keyboard) is not a breakpoint change.
  const width = useSyncExternalStore(
    subscribeToWindowWidth,
    getWindowWidth,
    getWindowWidth,
  )
  const containerWidth = useContext(BreakpointWidthContext)

  return containerWidth ?? width
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

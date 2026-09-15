import {createContext, useContext} from 'react'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'

export type ScreenPresence = {
  /**
   * How visible this screen is on screen, 0..1, tracking the native stack
   * transition frame by frame (including interactive swipe-back). Always 1 on
   * web and for screens that are not inside a native stack.
   */
  visibility: SharedValue<number>
  /**
   * `visibility`, but also 0 when the screen's tab (or any other ancestor
   * navigator) is not focused. This is the value shell UI should follow: it is
   * 1 exactly when the screen is what the user is looking at.
   */
  presence: SharedValue<number>
}

export const ScreenPresenceContext = createContext<ScreenPresence | null>(null)
ScreenPresenceContext.displayName = 'ScreenPresenceContext'

/**
 * Reads the presence of the nearest `Layout.Screen`. Outside of one, both
 * values are a constant 1.
 */
export function useScreenPresence(): ScreenPresence {
  const context = useContext(ScreenPresenceContext)
  const fallback = useSharedValue(1)
  return context ?? {visibility: fallback, presence: fallback}
}

import {type ViewProps} from 'react-native'

export type ZoomTransitionSourceProps = ViewProps & {
  /**
   * Matches the `sourceIdentifier` of a `ZoomTransition.Enabler` in the
   * screen this one navigates to. Doesn't need to be globally unique: only
   * sources inside the screen being zoomed from are considered.
   */
  identifier: string
}

export type ZoomTransitionEnablerProps = {
  /**
   * Which `ZoomTransition.Source` to zoom out of on push, and back into on
   * pop. Can change while the screen is open.
   */
  sourceIdentifier: string | undefined
  /**
   * Which interactive gestures can dismiss the screen. `horizontal` only
   * allows gestures that start out moving right, like a back swipe, which
   * keeps vertical scrolling from dismissing the screen.
   */
  dismissGesture?: 'default' | 'horizontal' | 'none'
}

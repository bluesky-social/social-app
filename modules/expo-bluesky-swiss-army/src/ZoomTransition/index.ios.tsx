import {requireNativeViewManager} from 'expo-modules-core'

import {
  type ZoomTransitionEnablerProps,
  type ZoomTransitionSourceProps,
} from './types'

const NativeSource: React.ComponentType<ZoomTransitionSourceProps> =
  requireNativeViewManager(
    'ExpoBlueskyZoomTransition',
    'ZoomTransitionSourceView',
  )

const NativeEnabler: React.ComponentType<
  ZoomTransitionEnablerProps & {
    pointerEvents: 'none'
    style: {position: 'absolute'; width: 0; height: 0}
  }
> = requireNativeViewManager(
  'ExpoBlueskyZoomTransition',
  'ZoomTransitionEnablerView',
)

/**
 * Wraps the view to zoom out of. Behaves like a View: its frame and corner
 * radius are what the transition starts from.
 */
export function Source(props: ZoomTransitionSourceProps) {
  return <NativeSource {...props} />
}

/**
 * Render inside the destination screen to give it a zoom transition. Renders
 * nothing visible.
 */
export function Enabler(props: ZoomTransitionEnablerProps) {
  return (
    <NativeEnabler
      {...props}
      pointerEvents="none"
      style={{position: 'absolute', width: 0, height: 0}}
    />
  )
}

import {useEffect} from 'react'

import {
  type GlobalGestureEvents,
  useGlobalGestureEvents,
} from '#/state/global-gesture-events'

/**
 * Listen for global gesture events. Callback should be wrapped with
 * `useCallback` or otherwise memoized to avoid unnecessary re-renders.
 */
export function useOnGesture(
  onGestureCallback: (e: GlobalGestureEvents['begin']) => void,
) {
  const ctx = useGlobalGestureEvents()
  useEffect(() => {
    ctx.register()
    ctx.events.on('begin', onGestureCallback)
    return () => {
      ctx.unregister()
      ctx.events.off('begin', onGestureCallback)
    }
  }, [ctx, onGestureCallback])
}

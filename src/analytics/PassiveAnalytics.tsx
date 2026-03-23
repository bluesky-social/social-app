import {useEffect, useRef} from 'react'

import {getCurrentState, onAppStateChange} from '#/lib/appState'
import {useAnalytics} from '#/analytics'

/**
 * Tracks passive analytics like app foreground/background time.
 */
export function PassiveAnalytics() {
  const ax = useAnalytics()
  const lastActive = useRef(
    getCurrentState() === 'active' ? performance.now() : null,
  )

  useEffect(() => {
    const sub = onAppStateChange(state => {
      if (state === 'active') {
        lastActive.current = performance.now()
        ax.metric('state:foreground', {})
      } else if (lastActive.current !== null) {
        ax.metric('state:background', {
          secondsActive: Math.round(
            (performance.now() - lastActive.current) / 1e3,
          ),
        })
      }
    })
    return () => sub.remove()
  }, [ax])

  return null
}

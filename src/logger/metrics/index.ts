import {getCurrentState, onAppStateChange} from '#/lib/appState'
import {MetricsClient} from '#/logger/metrics/client'

export {type Metrics} from '#/logger/metrics/events'

/**
 * Active metrics client
 */
export const metrics = new MetricsClient()

/**
 * Passive metrics go here
 */

let lastActive = getCurrentState() === 'active' ? performance.now() : null
onAppStateChange(state => {
  if (state === 'active') {
    lastActive = performance.now()
    metrics.track('state:foreground', {})
  } else if (lastActive !== null) {
    metrics.track('state:background', {
      secondsActive: Math.round((performance.now() - lastActive) / 1e3),
    })
  }
})

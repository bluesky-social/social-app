import {MetricsClient} from '#/analytics/metrics/client'
import {type Events} from '#/analytics/metrics/types'

export type {Events as Metrics} from '#/analytics/metrics/types'
export const metrics = new MetricsClient<Events>()

/*
 * TODO
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
*/

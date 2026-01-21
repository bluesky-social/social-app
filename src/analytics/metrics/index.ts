import {MetricsClient} from '#/analytics/metrics/client'
import {type Events} from '#/analytics/metrics/types'

export type {Events as Metrics} from '#/analytics/metrics/types'
export const metrics = new MetricsClient<Events>()

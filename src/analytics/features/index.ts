import {GrowthBook} from '@growthbook/growthbook-react'

import {type Metadata} from '#/analytics/metadata'
import * as env from '#/env'

export {Features} from '#/analytics/features/types'

/**
 * We vary the amount of time we wait for GrowthBook to fetch feature
 * gates based on the strategy specified.
 */
export type FeatureFetchStrategy = 'prefer-low-latency' | 'prefer-fresh-gates'

const TIMEOUT_INIT = 500 // TODO should base on p99 or something
const TIMEOUT_PREFER_LOW_LATENCY = 250
const TIMEOUT_PREFER_FRESH_GATES = 1500

export const features = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
})

/**
 * Initializer promise that must be awaited before using the GrowthBook
 * instance or rendering the `AnalyticsFeaturesContext`. Note: this may not be
 * fully initialized if it takes longer than `TIMEOUT_INIT` to initialize. In
 * that case, we may see a flash of uncustomized content until the
 * initialization completes.
 */
export const init = new Promise<void>(async y => {
  await features.init({timeout: TIMEOUT_INIT})
  y()
})

/**
 * Refresh feature gates from GrowthBook. Updates attributes based on the
 * provided account, if any.
 */
export async function refresh({strategy}: {strategy: FeatureFetchStrategy}) {
  await features.refreshFeatures({
    timeout:
      strategy === 'prefer-low-latency'
        ? TIMEOUT_PREFER_LOW_LATENCY
        : TIMEOUT_PREFER_FRESH_GATES,
  })
}

/**
 * Converts our metadata into GrowthBook attributes and sets them.
 */
export function setAttributes({base, session, preferences}: Metadata) {
  const {deviceId, sessionId, ...br} = base
  features.setAttributes({
    device_id: deviceId, // GrowthBook special field
    session_id: sessionId, // GrowthBook special field
    user_id: session?.did, // GrowthBook special field
    id: session?.did, // GrowthBook special field
    ...br,
    ...(session || {}),
    ...(preferences || {}),
  })
}

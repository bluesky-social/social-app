import {useCallback} from 'react'
import {GrowthBook} from '@growthbook/growthbook-react'

import {type Metadata} from '#/logger/metadata'
import {metrics} from '#/logger/metrics'
import * as env from '#/env'

const debugEnabled = env.IS_DEV && true
const debug = (message: string, attributes?: Record<string, any>) => {
  if (debugEnabled) {
    console.debug(`(growthbook) ${message}`, attributes || {})
  }
}

const TIMEOUT_INIT = 500 // TODO should base on p99 or something
const TIMEOUT_PREFER_LOW_LATENCY = 250
const TIMEOUT_PREFER_FRESH_GATES = 1500

/**
 * We vary the amount of time we wait for GrowthBook to fetch feature
 * gates based on the strategy specified.
 */
type FeatureFetchStrategy = 'prefer-low-latency' | 'prefer-fresh-gates'

const gb = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
  trackingCallback: (experiment, result) => {
    metrics.track('experiment:viewed', {
      experimentId: experiment.key,
      variationId: result.key,
    })
  },
  /**
   * Initial values are set on startup in `#/logger/metdata/index.ts`
   */
  attributes: {},
})

/**
 * Initializer promise that must be awaited before using the GrowthBook
 * instance or rendering the `Provider`. Note: this may not be fully
 * initialized if it takes longer than `TIMEOUT_INIT` to initialize. In that
 * case, we may see a flash of uncustomized content until the initialization
 * completes.
 */
export const initializer = new Promise<void>(async y => {
  await gb.init({timeout: TIMEOUT_INIT})
  y()
})

export function getGrowthBook() {
  return gb
}

/**
 * Converts our metadata into GrowthBook attributes and sets them.
 */
export function setGrowthBookAttributes({
  deviceId: device_id,
  sessionId: session_id,
  ...metadata
}: Metadata) {
  gb.setAttributes({
    device_id, // GrowthBook special field
    session_id, // GrowthBook special field
    user_id: metadata.did, // GrowthBook special field
    ...metadata,
  })
}

/**
 * Refresh feature gates from GrowthBook. Updates attributes based on the
 * provided account, if any.
 */
export async function refresh({strategy}: {strategy: FeatureFetchStrategy}) {
  debug(`refresh`, {strategy})
  await gb.refreshFeatures({
    timeout:
      strategy === 'prefer-low-latency'
        ? TIMEOUT_PREFER_LOW_LATENCY
        : TIMEOUT_PREFER_FRESH_GATES,
  })
}

/**
 * Hook to check if a feature gate is enabled
 */
export function useGate() {
  return useCallback((gate: string): boolean => {
    return gb.isOn(gate)
  }, [])
}

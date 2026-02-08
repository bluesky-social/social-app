import {MMKV} from '@bsky.app/react-native-mmkv'
import {setPolyfills} from '@growthbook/growthbook'
import {GrowthBook} from '@growthbook/growthbook-react'

import {getNavigationMetadata, type Metadata} from '#/analytics/metadata'
import * as env from '#/env'

export {Features} from '#/analytics/features/types'

const CACHE = new MMKV({id: 'bsky_features_cache'})

setPolyfills({
  localStorage: {
    getItem: key => {
      const value = CACHE.getString(key)
      return value != null ? JSON.parse(value) : null
    },
    setItem: async (key, value) => {
      CACHE.set(key, value)
    },
  },
})

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
 * Converts our metadata into GrowthBook attributes and sets them. GrowthBook
 * attributes are manually configured in the GrowthBook dashboard. So these
 * values need to match exactly. Therefore, let's add them here manually to and
 * not spread them to avoid mistakes.
 */
export function setAttributes({
  base,
  geolocation,
  session,
  preferences,
}: Metadata) {
  features.setAttributes({
    deviceId: base.deviceId,
    sessionId: base.sessionId,
    platform: base.platform,
    appVersion: base.appVersion,
    countryCode: geolocation.countryCode,
    regionCode: geolocation.regionCode,
    did: session?.did,
    isBskyPds: session?.isBskyPds,
    appLanguage: preferences?.appLanguage,
    contentLanguages: preferences?.contentLanguages,
    currentScreen: getNavigationMetadata()?.currentScreen,
  })
}

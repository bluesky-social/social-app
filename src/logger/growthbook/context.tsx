import {useCallback, useEffect} from 'react'
import {Platform} from 'react-native'
import {growthbookTrackingPlugin} from '@growthbook/growthbook/plugins'
import {GrowthBook, GrowthBookProvider} from '@growthbook/growthbook-react'

import {BSKY_SERVICE} from '#/lib/constants'
import {
  getAndMigrateStableId,
  getSessionId,
  getStableId,
  getStableIdOrThrow,
} from '#/logger/growthbook/identifiers'
import * as referrer from '#/logger/growthbook/util/referrer'
import * as persisted from '#/state/persisted'
import {type SessionAccount, useSession} from '#/state/session'
import * as env from '#/env'
import {type Geolocation, useGeolocation} from '#/geolocation'

const TIMEOUT_INIT = 500 // TODO should base on p99 or something
const TIMEOUT_PREFER_LOW_LATENCY = 250
const TIMEOUT_PREFER_FRESH_GATES = 1500

/**
 * We vary the amount of time we wait for GrowthBook to fetch feature
 * gates based on the strategy specified.
 *
 * TODO examples
 */
type FeatureFetchStrategy = 'prefer-low-latency' | 'prefer-fresh-gates'

/**
 * These are fields that are handled specially by GrowthBook
 */
type GrowthBookDefaultAttributes = {
  /** Special GrowthBook field */
  device_id: string
  /** Special GrowthBook field */
  session_id: string
}
/**
 * These are user fields that are handled specially by GrowthBook
 */
type GrowthBookDefaultUserAttributes = {
  /** Special GrowthBook field */
  user_id: string
}
type DefaultAttributes = GrowthBookDefaultAttributes & {
  /** Custom field provided by our Geolocation context */
  country: string
}
type UserAttributes = GrowthBookDefaultUserAttributes & {
  // do not use `id`, GrowthBook will think it's the same as `device_id`
  did: string
  isBskyPds: boolean
  platform: string
  appVersion: string
  bundleIdentifier: string
  bundleDate: number
  refSrc: string
  refUrl: string
  appLanguage: string
  contentLanguages: string[]
}
type Attributes = DefaultAttributes & UserAttributes

/**
 * We cache the geolocation outside of React to use when setting
 * default attributes outside React, such as during `refresh()`.
 */
let unsafeGeolocation: Geolocation | null = null

const gb = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
  plugins: [growthbookTrackingPlugin()],
  trackingCallback: (experiment, result) => {
    console.log('Experiment Viewed', {
      experimentId: experiment.key,
      variationId: result.key,
    })
    gb.logEvent('Experiment Viewed', {
      experimentId: experiment.key,
      variationId: result.key,
    })
  },
  attributes: {
    device_id: getStableId() || 'unset',
    session_id: getSessionId(),
  } satisfies GrowthBookDefaultAttributes,
})

/**
 * Initializer promise that must be awaited before using the GrowthBook
 * instance or rendering the `Provider`. Note: this may not be fully
 * initialized if it takes longer than `TIMEOUT_INIT` to initialize. In that
 * case, we may see a flash of uncustomized content until the initialization
 * completes.
 */
export const initializer = new Promise<void>(async y => {
  /*
   * This _must_ happen first to ensure continuity of the device ID from
   * StatSig to GrowthBook
   */
  const id = await getAndMigrateStableId()
  const attr: GrowthBookDefaultAttributes = {
    device_id: id,
    session_id: getSessionId(),
  }
  gb.setAttributes(attr)
  await gb.init({timeout: TIMEOUT_INIT})
  y()
})

/**
 * Refresh feature gates from GrowthBook. Updates attributes based on the
 * provided account, if any.
 */
export async function refresh({
  account,
  strategy,
}: {
  account?: SessionAccount
  strategy: FeatureFetchStrategy
}) {
  setAttributesForAccount(account)
  await gb.refreshFeatures({
    timeout:
      strategy === 'prefer-low-latency'
        ? TIMEOUT_PREFER_LOW_LATENCY
        : TIMEOUT_PREFER_FRESH_GATES,
  })
}

/**
 * Log a custom event to our backend, using GrowthBook's event logging system.
 */
export function logEvent(eventName: string, metadata?: Record<string, any>) {
  gb.logEvent(eventName, metadata)
}

/**
 * Hook to check if a feature gate is enabled
 */
export function useGate() {
  return useCallback((gate: string): boolean => {
    return gb.isOn(gate)
  }, [])
}

/**
 * Main provider for GrowthBook and feature flag context. Should be rendered
 * _after_ `initializer` is complete, and _after_ the Session provider.
 */
export function Provider({children}: {children: React.ReactNode}) {
  const geo = useGeolocation()
  const {currentAccount} = useSession()

  /**
   * Decorate existing attributes with any new default attributes
   */
  useEffect(() => {
    // cache outside react
    unsafeGeolocation = geo
    const attr = {
      ...gb.getAttributes(),
      ...getDefaultAttributes(),
    }
    gb.setAttributes(attr)
    console.debug(`update attributes`, {attributes: attr})
  }, [geo])

  /**
   * Update user attributes on session change, and clear them on logout
   */
  useEffect(() => {
    setAttributesForAccount(currentAccount)
  }, [currentAccount])

  return <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>
}

/**
 * Get the default attributes that should always be set
 * on the GrowthBook instance
 */
function getDefaultAttributes() {
  return {
    device_id: getStableIdOrThrow(),
    session_id: getSessionId(),
    country: unsafeGeolocation?.countryCode || 'unknown',
  }
}

/**
 * Set attributes on the global GrowthBook instance. If an account is provided,
 * set user attributes as well. Otherwise, clear user attributes.
 */
function setAttributesForAccount(account?: SessionAccount) {
  if (account) {
    const attr: Attributes = {
      ...getDefaultAttributes(),
      ...(getUserAttributes(account) || {}),
    }
    gb.setAttributes(attr)
    console.debug(`setAttributesForAccount: has account`, {attributes: attr})
  } else {
    const attr = getDefaultAttributes()
    gb.setAttributes(attr)
    console.debug(`setAttributesForAccount: no account`, {attributes: attr})
  }
}

/**
 * Converts a SessionAccount into user attributes for GrowthBook
 */
export function getUserAttributes(account: SessionAccount): UserAttributes
export function getUserAttributes(account: undefined): null
export function getUserAttributes(
  account?: SessionAccount,
): UserAttributes | null {
  if (!account) return null
  const languagePrefs = persisted.get('languagePrefs')
  return {
    user_id: account.did,
    did: account.did,
    isBskyPds: account.service.startsWith(BSKY_SERVICE),
    platform: Platform.OS,
    appVersion: env.RELEASE_VERSION,
    bundleIdentifier: env.BUNDLE_IDENTIFIER,
    bundleDate: env.BUNDLE_DATE,
    appLanguage: languagePrefs.appLanguage,
    contentLanguages: languagePrefs.contentLanguages,
    refSrc: referrer.src,
    refUrl: referrer.url,
  }
}

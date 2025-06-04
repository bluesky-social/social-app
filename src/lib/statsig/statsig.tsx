import React from 'react'
import {Platform} from 'react-native'
import {AppState, type AppStateStatus} from 'react-native'
import {Statsig} from 'statsig-react-native-expo'

import {BUNDLE_DATE, BUNDLE_IDENTIFIER} from '#/lib/app-info'
import {logger} from '#/logger'
import {type MetricEvents} from '#/logger/metrics'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {device} from '#/storage'
import {timeout} from '../async/timeout'
// import {useNonReactiveCallback} from '../hooks/useNonReactiveCallback'
import {type Gate} from './gates'

// const SDK_KEY = 'client-SXJakO39w9vIhl3D44u8UupyzFl4oZ2qPIkjwcvuPsV'

export const initPromise = initialize()

type StatsigUser = {
  userID: string | undefined
  // TODO: Remove when enough users have custom.platform:
  platform: 'ios' | 'android' | 'web'
  custom: {
    // This is the place where we can add our own stuff.
    // Fields here have to be non-optional to be visible in the UI.
    platform: 'ios' | 'android' | 'web'
    bundleIdentifier: string
    bundleDate: number
    refSrc: string
    refUrl: string
    appLanguage: string
    contentLanguages: string[]
  }
}

let refSrc = ''
let refUrl = ''
if (isWeb && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  refSrc = params.get('ref_src') ?? ''
  refUrl = decodeURIComponent(params.get('ref_url') ?? '')
}

export type {MetricEvents as LogEvents}

// function createStatsigOptions(prefetchUsers: StatsigUser[]) {
//   return {
//     environment: {
//       tier:
//         process.env.NODE_ENV === 'development'
//           ? 'development'
//           : IS_TESTFLIGHT
//           ? 'staging'
//           : 'production',
//     },
//     // Don't block on waiting for network. The fetched config will kick in on next load.
//     // This ensures the UI is always consistent and doesn't update mid-session.
//     // Note this makes cold load (no local storage) and private mode return `false` for all gates.
//     initTimeoutMs: 1,
//     // Get fresh flags for other accounts as well, if any.
//     prefetchUsers,
//     api: 'https://events.bsky.app/v2',
//   }
// }

type FlatJSONRecord = Record<
  string,
  | string
  | number
  | boolean
  | null
  | undefined
  // Technically not scalar but Statsig will stringify it which works for us:
  | string[]
>

let getCurrentRouteName: () => string | null | undefined = () => null

export function attachRouteToLogEvents(
  getRouteName: () => string | null | undefined,
) {
  getCurrentRouteName = getRouteName
}

export function toClout(n: number | null | undefined): number | undefined {
  if (n == null) {
    return undefined
  } else {
    return Math.max(0, Math.round(Math.log(n)))
  }
}

/**
 * @deprecated use `logger.metric()` instead
 */
export function logEvent<E extends keyof MetricEvents>(
  eventName: E & string,
  rawMetadata: MetricEvents[E] & FlatJSONRecord,
  options: {
    /**
     * Send to our data lake only, not to StatSig
     */
    lake?: boolean
  } = {lake: false},
) {
  try {
    const fullMetadata = toStringRecord(rawMetadata)
    fullMetadata.routeName = getCurrentRouteName() ?? '(Uninitialized)'
    if (Statsig.initializeCalled()) {
      let ev: string = eventName
      if (options.lake) {
        ev = `lake:${ev}`
      }
      Statsig.logEvent(ev, null, fullMetadata)
    }
    /**
     * All datalake events should be sent using `logger.metric`, and we don't
     * want to double-emit logs to other transports.
     */
    if (!options.lake) {
      logger.info(eventName, fullMetadata)
    }
  } catch (e) {
    // A log should never interrupt the calling code, whatever happens.
    logger.error('Failed to log an event', {message: e})
  }
}

function toStringRecord<E extends keyof MetricEvents>(
  metadata: MetricEvents[E] & FlatJSONRecord,
): Record<string, string> {
  const record: Record<string, string> = {}
  for (let key in metadata) {
    if (metadata.hasOwnProperty(key)) {
      if (typeof metadata[key] === 'string') {
        record[key] = metadata[key]
      } else {
        record[key] = JSON.stringify(metadata[key])
      }
    }
  }
  return record
}

// We roll our own cache in front of Statsig because it is a singleton
// and it's been difficult to get it to behave in a predictable way.
// Our own cache ensures consistent evaluation within a single session.
const GateCache = React.createContext<Map<string, boolean> | null>(null)

type GateOptions = {
  dangerouslyDisableExposureLogging?: boolean
}

export function useGatesCache(): Map<string, boolean> {
  const cache = React.useContext(GateCache)
  if (!cache) {
    throw Error('useGate() cannot be called outside StatsigProvider.')
  }
  return cache
}

function writeBlackskyGateCache(cache: Map<string, boolean>) {
  device.set(['blackskyGateCache'], JSON.stringify(Object.fromEntries(cache)))
}

export function resetBlackskyGateCache() {
  writeBlackskyGateCache(new Map())
}

export function useGate(): (gateName: Gate, options?: GateOptions) => boolean {
  const cache = React.useContext(GateCache)
  if (!cache) {
    throw Error('useGate() cannot be called outside StatsigProvider.')
  }
  const gate = React.useCallback(
    (gateName: Gate, options: GateOptions = {}): boolean => {
      const cachedValue = cache.get(gateName)
      if (cachedValue !== undefined) {
        return cachedValue
      }
      let value = false
      if (Statsig.initializeCalled()) {
        if (options.dangerouslyDisableExposureLogging) {
          value = Statsig.checkGateWithExposureLoggingDisabled(gateName)
        } else {
          value = Statsig.checkGate(gateName)
        }
      }
      cache.set(gateName, value)
      writeBlackskyGateCache(cache)
      return value
    },
    [cache],
  )
  return gate
}

/**
 * Debugging tool to override a gate. USE ONLY IN E2E TESTS!
 */
export function useDangerousSetGate(): (
  gateName: Gate,
  value: boolean,
) => void {
  const cache = React.useContext(GateCache)
  if (!cache) {
    throw Error(
      'useDangerousSetGate() cannot be called outside StatsigProvider.',
    )
  }
  const dangerousSetGate = React.useCallback(
    (gateName: Gate, value: boolean) => {
      cache.set(gateName, value)
      writeBlackskyGateCache(cache)
    },
    [cache],
  )
  return dangerousSetGate
}

function toStatsigUser(did: string | undefined): StatsigUser {
  const languagePrefs = persisted.get('languagePrefs')
  return {
    userID: did,
    platform: Platform.OS as 'ios' | 'android' | 'web',
    custom: {
      refSrc,
      refUrl,
      platform: Platform.OS as 'ios' | 'android' | 'web',
      bundleIdentifier: BUNDLE_IDENTIFIER,
      bundleDate: BUNDLE_DATE,
      appLanguage: languagePrefs.appLanguage,
      contentLanguages: languagePrefs.contentLanguages,
    },
  }
}

let lastState: AppStateStatus = AppState.currentState
let lastActive = lastState === 'active' ? performance.now() : null
AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === lastState) {
    return
  }
  lastState = state
  if (state === 'active') {
    lastActive = performance.now()
    logEvent('state:foreground', {})
  } else {
    let secondsActive = 0
    if (lastActive != null) {
      secondsActive = Math.round((performance.now() - lastActive) / 1e3)
      lastActive = null
      logEvent('state:background', {
        secondsActive,
      })
    }
  }
})

export async function tryFetchGates(
  did: string | undefined,
  strategy: 'prefer-low-latency' | 'prefer-fresh-gates',
) {
  try {
    let timeoutMs = 250 // Don't block the UI if we can't do this fast.
    if (strategy === 'prefer-fresh-gates') {
      // Use this for less common operations where the user would be OK with a delay.
      timeoutMs = 1500
    }
    if (Statsig.initializeCalled()) {
      await Promise.race([
        timeout(timeoutMs),
        Statsig.prefetchUsers([toStatsigUser(did)]),
      ])
    }
  } catch (e) {
    // Don't leak errors to the calling code, this is meant to be always safe.
    console.error(e)
  }
}

export function initialize() {
  // return Statsig.initialize(SDK_KEY, null, createStatsigOptions([]))
  return new Promise(() => {})
}

export function Provider({children}: {children: React.ReactNode}) {
  const gateCache = new Map<string, boolean>(
    Object.entries(JSON.parse(device.get(['blackskyGateCache']) ?? '{}')),
  )

  return <GateCache.Provider value={gateCache}>{children}</GateCache.Provider>
}

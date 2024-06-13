import React from 'react'
import {Platform} from 'react-native'
import {AppState, AppStateStatus} from 'react-native'
import {sha256} from 'js-sha256'
import {Statsig, StatsigProvider} from 'statsig-react-native-expo'

import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {BUNDLE_DATE, BUNDLE_IDENTIFIER, IS_TESTFLIGHT} from 'lib/app-info'
import {useSession} from '../../state/session'
import {timeout} from '../async/timeout'
import {useNonReactiveCallback} from '../hooks/useNonReactiveCallback'
import {LogEvents} from './events'
import {Gate} from './gates'

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
    referrer: string
    referrerHostname: string
    appLanguage: string
    contentLanguages: string[]
  }
}

let refSrc = ''
let refUrl = ''
let referrer = ''
let referrerHostname = ''
if (isWeb && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  refSrc = params.get('ref_src') ?? ''
  refUrl = decodeURIComponent(params.get('ref_url') ?? '')
}

if (isWeb && document !== 'undefined' && document != null) {
  const url = new URL(document.referrer)
  if (url.hostname !== 'bsky.app') {
    referrer = document.referrer
    referrerHostname = url.hostname
  }
}

export type {LogEvents}

function createStatsigOptions(prefetchUsers: StatsigUser[]) {
  return {
    environment: {
      tier:
        process.env.NODE_ENV === 'development'
          ? 'development'
          : IS_TESTFLIGHT
          ? 'staging'
          : 'production',
    },
    // Don't block on waiting for network. The fetched config will kick in on next load.
    // This ensures the UI is always consistent and doesn't update mid-session.
    // Note this makes cold load (no local storage) and private mode return `false` for all gates.
    initTimeoutMs: 1,
    // Get fresh flags for other accounts as well, if any.
    prefetchUsers,
  }
}

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

const DOWNSAMPLED_EVENTS: Set<keyof LogEvents> = new Set([
  'router:navigate:sampled',
  'state:background:sampled',
  'state:foreground:sampled',
  'home:feedDisplayed:sampled',
  'feed:endReached:sampled',
  'feed:refresh:sampled',
])
const isDownsampledSession = Math.random() < 0.9 // 90% likely

export function logEvent<E extends keyof LogEvents>(
  eventName: E & string,
  rawMetadata: LogEvents[E] & FlatJSONRecord,
) {
  try {
    if (
      process.env.NODE_ENV === 'development' &&
      eventName.endsWith(':sampled') &&
      !DOWNSAMPLED_EVENTS.has(eventName)
    ) {
      logger.error(
        'Did you forget to add ' + eventName + ' to DOWNSAMPLED_EVENTS?',
      )
    }

    if (isDownsampledSession && DOWNSAMPLED_EVENTS.has(eventName)) {
      return
    }
    const fullMetadata = {
      ...rawMetadata,
    } as Record<string, string> // Statsig typings are unnecessarily strict here.
    fullMetadata.routeName = getCurrentRouteName() ?? '(Uninitialized)'
    if (Statsig.initializeCalled()) {
      Statsig.logEvent(eventName, null, fullMetadata)
    }
  } catch (e) {
    // A log should never interrupt the calling code, whatever happens.
    logger.error('Failed to log an event', {message: e})
  }
}

// We roll our own cache in front of Statsig because it is a singleton
// and it's been difficult to get it to behave in a predictable way.
// Our own cache ensures consistent evaluation within a single session.
const GateCache = React.createContext<Map<string, boolean> | null>(null)

type GateOptions = {
  dangerouslyDisableExposureLogging?: boolean
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
    },
    [cache],
  )
  return dangerousSetGate
}

function toStatsigUser(did: string | undefined): StatsigUser {
  let userID: string | undefined
  if (did) {
    userID = sha256(did)
  }
  const languagePrefs = persisted.get('languagePrefs')
  return {
    userID,
    platform: Platform.OS as 'ios' | 'android' | 'web',
    custom: {
      refSrc,
      refUrl,
      referrer,
      referrerHostname,
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
    logEvent('state:foreground:sampled', {})
  } else {
    let secondsActive = 0
    if (lastActive != null) {
      secondsActive = Math.round((performance.now() - lastActive) / 1e3)
    }
    lastActive = null
    logEvent('state:background:sampled', {
      secondsActive,
    })
  }
})

export async function tryFetchGates(
  did: string,
  strategy: 'prefer-low-latency' | 'prefer-fresh-gates',
) {
  try {
    let timeoutMs = 250 // Don't block the UI if we can't do this fast.
    if (strategy === 'prefer-fresh-gates') {
      // Use this for less common operations where the user would be OK with a delay.
      timeoutMs = 1500
    }
    // Note: This condition is currently false the very first render because
    // Statsig has not initialized yet. In the future, we can fix this by
    // doing the initialization ourselves instead of relying on the provider.
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

export function Provider({children}: {children: React.ReactNode}) {
  const {currentAccount, accounts} = useSession()
  const did = currentAccount?.did
  const currentStatsigUser = React.useMemo(() => toStatsigUser(did), [did])

  const otherDidsConcatenated = accounts
    .map(account => account.did)
    .filter(accountDid => accountDid !== did)
    .join(' ') // We're only interested in DID changes.
  const otherStatsigUsers = React.useMemo(
    () => otherDidsConcatenated.split(' ').map(toStatsigUser),
    [otherDidsConcatenated],
  )
  const statsigOptions = React.useMemo(
    () => createStatsigOptions(otherStatsigUsers),
    [otherStatsigUsers],
  )

  // Have our own cache in front of Statsig.
  // This ensures the results remain stable until the active DID changes.
  const [gateCache, setGateCache] = React.useState(() => new Map())
  const [prevDid, setPrevDid] = React.useState(did)
  if (did !== prevDid) {
    setPrevDid(did)
    setGateCache(new Map())
  }

  // Periodically poll Statsig to get the current rule evaluations for all stored accounts.
  // These changes are prefetched and stored, but don't get applied until the active DID changes.
  // This ensures that when you switch an account, it already has fresh results by then.
  const handleIntervalTick = useNonReactiveCallback(() => {
    if (Statsig.initializeCalled()) {
      // Note: Only first five will be taken into account by Statsig.
      Statsig.prefetchUsers([currentStatsigUser, ...otherStatsigUsers])
    }
  })
  React.useEffect(() => {
    const id = setInterval(handleIntervalTick, 60e3 /* 1 min */)
    return () => clearInterval(id)
  }, [handleIntervalTick])

  return (
    <GateCache.Provider value={gateCache}>
      <StatsigProvider
        key={did}
        sdkKey="client-SXJakO39w9vIhl3D44u8UupyzFl4oZ2qPIkjwcvuPsV"
        mountKey={currentStatsigUser.userID}
        user={currentStatsigUser}
        // This isn't really blocking due to short initTimeoutMs above.
        // However, it ensures `isLoading` is always `false`.
        waitForInitialization={true}
        options={statsigOptions}>
        {children}
      </StatsigProvider>
    </GateCache.Provider>
  )
}

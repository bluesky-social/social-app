import React from 'react'
import {Platform} from 'react-native'
import {AppState, AppStateStatus} from 'react-native'
import {sha256} from 'js-sha256'
import {Statsig, StatsigProvider} from 'statsig-react-native-expo'

import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {IS_TESTFLIGHT} from 'lib/app-info'
import {useSession} from '../../state/session'
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
    refSrc: string
    refUrl: string
  }
}

let refSrc = ''
let refUrl = ''
if (isWeb && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  refSrc = params.get('ref_src') ?? ''
  refUrl = decodeURIComponent(params.get('ref_url') ?? '')
}

export type {LogEvents}

const statsigOptions = {
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

export function logEvent<E extends keyof LogEvents>(
  eventName: E & string,
  rawMetadata: LogEvents[E] & FlatJSONRecord,
) {
  try {
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

export function useGate(): (gateName: Gate) => boolean {
  const cache = React.useRef<Map<Gate, boolean>>()
  if (cache.current === undefined) {
    cache.current = new Map()
  }
  const gate = React.useCallback((gateName: Gate): boolean => {
    // TODO: Replace local cache with a proper session one.
    const cachedValue = cache.current!.get(gateName)
    if (cachedValue !== undefined) {
      return cachedValue
    }
    const value = Statsig.initializeCalled()
      ? Statsig.checkGate(gateName)
      : false
    cache.current!.set(gateName, value)
    return value
  }, [])
  return gate
}

function toStatsigUser(did: string | undefined): StatsigUser {
  let userID: string | undefined
  if (did) {
    userID = sha256(did)
  }
  return {
    userID,
    platform: Platform.OS as 'ios' | 'android' | 'web',
    custom: {
      refSrc,
      refUrl,
      platform: Platform.OS as 'ios' | 'android' | 'web',
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
    }
    lastActive = null
    logEvent('state:background', {
      secondsActive,
    })
  }
})

export function Provider({children}: {children: React.ReactNode}) {
  const {currentAccount} = useSession()
  const currentStatsigUser = React.useMemo(
    () => toStatsigUser(currentAccount?.did),
    [currentAccount?.did],
  )

  React.useEffect(() => {
    function refresh() {
      // Intentionally refetching the config using the JS SDK rather than React SDK
      // so that the new config is stored in cache but isn't used during this session.
      // It will kick in for the next reload.
      Statsig.updateUser(currentStatsigUser)
    }
    const id = setInterval(refresh, 3 * 60e3 /* 3 min */)
    return () => clearInterval(id)
  }, [currentStatsigUser])

  return (
    <StatsigProvider
      sdkKey="client-SXJakO39w9vIhl3D44u8UupyzFl4oZ2qPIkjwcvuPsV"
      mountKey={currentStatsigUser.userID}
      user={currentStatsigUser}
      // This isn't really blocking due to short initTimeoutMs above.
      // However, it ensures `isLoading` is always `false`.
      waitForInitialization={true}
      options={statsigOptions}>
      {children}
    </StatsigProvider>
  )
}

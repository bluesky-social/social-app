import React from 'react'
import {Platform} from 'react-native'
import {AppState, AppStateStatus} from 'react-native'
import {sha256} from 'js-sha256'
import {
  Statsig,
  StatsigProvider,
  useGate as useStatsigGate,
} from 'statsig-react-native-expo'

import {logger} from '#/logger'
import {useSession} from '../../state/session'
import {LogEvents} from './events'

export type {LogEvents}

const statsigOptions = {
  environment: {
    tier: process.env.NODE_ENV === 'development' ? 'development' : 'production',
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

export function useGate(gateName: string) {
  const {isLoading, value} = useStatsigGate(gateName)
  if (isLoading) {
    // This should not happen because of waitForInitialization={true}.
    console.error('Did not expected isLoading to ever be true.')
  }
  return value
}

function toStatsigUser(did: string | undefined) {
  let userID: string | undefined
  if (did) {
    userID = sha256(did)
  }
  return {
    userID,
    platform: Platform.OS,
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

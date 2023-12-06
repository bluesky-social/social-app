import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createClient,
  AnalyticsProvider,
  useAnalytics as useAnalyticsOrig,
  ClientMethods,
} from '@segment/analytics-react-native'
import {useSession, SessionAccount} from '#/state/session'
import {sha256} from 'js-sha256'
import {ScreenEvent, TrackEvent} from './types'
import {logger} from '#/logger'

type AppInfo = {
  build?: string | undefined
  name?: string | undefined
  namespace?: string | undefined
  version?: string | undefined
}

const segmentClient = createClient({
  writeKey: '8I6DsgfiSLuoONyaunGoiQM7A6y2ybdI',
  trackAppLifecycleEvents: false,
  proxy: 'https://api.events.bsky.app/v1',
})

export const track = segmentClient?.track?.bind?.(segmentClient) as TrackEvent

export function useAnalytics() {
  const {hasSession} = useSession()
  const methods: ClientMethods = useAnalyticsOrig()
  return React.useMemo(() => {
    if (hasSession) {
      return {
        screen: methods.screen as ScreenEvent, // ScreenEvents defines all the possible screen names
        track: methods.track as TrackEvent, // TrackEvents defines all the possible track events and their properties
        identify: methods.identify,
        flush: methods.flush,
        group: methods.group,
        alias: methods.alias,
        reset: methods.reset,
      }
    }
    // dont send analytics pings for anonymous users
    return {
      screen: () => Promise<void>,
      track: () => Promise<void>,
      identify: () => Promise<void>,
      flush: () => Promise<void>,
      group: () => Promise<void>,
      alias: () => Promise<void>,
      reset: () => Promise<void>,
    }
  }, [hasSession, methods])
}

export function init(account: SessionAccount | undefined) {
  setupListenersOnce()

  if (account) {
    if (account.did) {
      const did_hashed = sha256(account.did)
      segmentClient.identify(did_hashed, {did_hashed})
      logger.debug('Ping w/hash')
    } else {
      logger.debug('Ping w/o hash')
      segmentClient.identify()
    }
  }
}

let didSetupListeners = false
function setupListenersOnce() {
  if (didSetupListeners) {
    return
  }
  didSetupListeners = true
  // NOTE
  // this is a copy of segment's own lifecycle event tracking
  // we handle it manually to ensure that it never fires while the app is backgrounded
  // -prf
  segmentClient.isReady.onChange(async () => {
    if (AppState.currentState !== 'active') {
      logger.debug('Prevented a metrics ping while the app was backgrounded')
      return
    }
    const context = segmentClient.context.get()
    if (typeof context?.app === 'undefined') {
      logger.debug('Aborted metrics ping due to unavailable context')
      return
    }

    const oldAppInfo = await readAppInfo()
    const newAppInfo = context.app as AppInfo
    writeAppInfo(newAppInfo)
    logger.debug('Recording app info', {new: newAppInfo, old: oldAppInfo})

    if (typeof oldAppInfo === 'undefined') {
      segmentClient.track('Application Installed', {
        version: newAppInfo.version,
        build: newAppInfo.build,
      })
    } else if (newAppInfo.version !== oldAppInfo.version) {
      segmentClient.track('Application Updated', {
        version: newAppInfo.version,
        build: newAppInfo.build,
        previous_version: oldAppInfo.version,
        previous_build: oldAppInfo.build,
      })
    }
    segmentClient.track('Application Opened', {
      from_background: false,
      version: newAppInfo.version,
      build: newAppInfo.build,
    })
  })

  let lastState: AppStateStatus = AppState.currentState
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active' && lastState !== 'active') {
      const context = segmentClient.context.get()
      segmentClient.track('Application Opened', {
        from_background: true,
        version: context?.app?.version,
        build: context?.app?.build,
      })
    } else if (state !== 'active' && lastState === 'active') {
      segmentClient.track('Application Backgrounded')
    }
    lastState = state
  })
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <AnalyticsProvider client={segmentClient}>{children}</AnalyticsProvider>
  )
}

async function writeAppInfo(value: AppInfo) {
  await AsyncStorage.setItem('BSKY_APP_INFO', JSON.stringify(value))
}

async function readAppInfo(): Promise<AppInfo | undefined> {
  const rawData = await AsyncStorage.getItem('BSKY_APP_INFO')
  const obj = rawData ? JSON.parse(rawData) : undefined
  if (!obj || typeof obj !== 'object') {
    return undefined
  }
  return obj
}

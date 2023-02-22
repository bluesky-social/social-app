import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import {createClient, AnalyticsProvider} from '@segment/analytics-react-native'
import {RootStoreModel, AppInfo} from 'state/models/root-store'

const segmentClient = createClient({
  writeKey: '8I6DsgfiSLuoONyaunGoiQM7A6y2ybdI',
  trackAppLifecycleEvents: false,
})

export {useAnalytics} from '@segment/analytics-react-native'

export function init(store: RootStoreModel) {
  // NOTE
  // this method is a copy of segment's own lifecycle event tracking
  // we handle it manually to ensure that it never fires while the app is backgrounded
  // -prf
  segmentClient.onContextLoaded(() => {
    if (AppState.currentState !== 'active') {
      store.log.debug('Prevented a metrics ping while the app was backgrounded')
      return
    }
    const context = segmentClient.context.get()
    if (typeof context?.app === 'undefined') {
      store.log.debug('Aborted metrics ping due to unavailable context')
      return
    }

    const oldAppInfo = store.appInfo
    const newAppInfo = context.app as AppInfo
    store.setAppInfo(newAppInfo)
    store.log.debug('Recording app info', {new: newAppInfo, old: oldAppInfo})

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

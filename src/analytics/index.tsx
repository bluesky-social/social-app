import {createContext, useContext, useMemo} from 'react'
import {Platform} from 'react-native'

import {
  getAndMigrateDeviceId,
  getDeviceIdOrThrow,
  getInitialSessionId,
  useSessionId,
} from '#/analytics/identifiers'
import {type Metrics, metrics} from '#/analytics/metrics'
import * as referrer from '#/analytics/misc/referrer'
import {type MergeableMetadata, type Metadata} from '#/analytics/types'
import * as env from '#/env'
import {useGeolocation} from '#/geolocation'
import {device} from '#/storage'

export * as utils from '#/analytics/utils'

type ContextType = {
  metric: <E extends keyof Metrics>(
    event: E,
    payload: Metrics[E],
    metadata?: MergeableMetadata,
  ) => void
  metadata: Metadata
}

const Context = createContext<ContextType>({
  metric: (event, payload, metadata) => {
    metrics.track(event, payload, metadata)
  },
  metadata: {
    base: {
      deviceId: getDeviceIdOrThrow() ?? 'unknown',
      sessionId: getInitialSessionId(),
      platform: Platform.OS,
      appVersion: env.APP_VERSION,
      bundleIdentifier: env.BUNDLE_IDENTIFIER,
      bundleDate: env.BUNDLE_DATE,
      referrerSrc: referrer.src,
      referrerUrl: referrer.url,
    },
    geolocation: device.get(['mergedGeolocation']) || {
      countryCode: '',
      regionCode: '',
    },
  },
})

export const setupDeviceId = getAndMigrateDeviceId()

export function AnalyticsContext({
  children,
  metadata,
}: {
  children: React.ReactNode
  metadata?: MergeableMetadata
}) {
  if (metadata) {
    // @ts-ignore
    if (metadata.__meta !== true) {
      throw new Error(
        'Use the meta() helper when passing metadata to AnalyticsContext',
      )
    }
  }
  const sessionId = useSessionId()
  const geolocation = useGeolocation()
  const parentContext = useContext(Context)
  const childContext = useMemo(() => {
    const combinedMetadata = {
      ...parentContext.metadata,
      ...metadata,
    }
    combinedMetadata.base.sessionId = sessionId
    combinedMetadata.geolocation = geolocation
    const context: ContextType = {
      metadata: combinedMetadata,
      metric: (event, payload, extraMetadata) => {
        parentContext.metric(event, payload, {
          ...combinedMetadata,
          ...extraMetadata,
        })
      },
    }
    return context
  }, [sessionId, geolocation, parentContext, metadata])
  return <Context.Provider value={childContext}>{children}</Context.Provider>
}

export function useAnalytics() {
  return useContext(Context)
}

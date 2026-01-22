import {createContext, useContext, useEffect, useMemo} from 'react'
import {Platform} from 'react-native'

import {Logger} from '#/logger'
import {
  Features,
  features as feats,
  init,
  refresh,
  setAttributes,
} from '#/analytics/features'
import {
  getAndMigrateDeviceId,
  getDeviceId,
  getInitialSessionId,
  useSessionId,
} from '#/analytics/identifiers'
import {
  getMetadataForLogger,
  getNavigationMetadata,
  type MergeableMetadata,
  type Metadata,
} from '#/analytics/metadata'
import {type Metrics, metrics} from '#/analytics/metrics'
import * as refParams from '#/analytics/misc/refParams'
import * as env from '#/env'
import {useGeolocation} from '#/geolocation'
import {device} from '#/storage'

export * as utils from '#/analytics/utils'
export const features = {init, refresh}
export {Features} from '#/analytics/features'
export {type Metrics} from '#/analytics/metrics'

type LoggerType = {
  debug: Logger['debug']
  info: Logger['info']
  log: Logger['log']
  warn: Logger['warn']
  error: Logger['error']
  /**
   * Clones the existing logger and overrides the `context` value. Existing
   * metadata is inherited.
   *
   * ```ts
   * const ax = useAnalytics()
   * const logger = ax.logger.useChild(ax.logger.Context.Notifications)
   * ```
   */
  useChild: (context: Exclude<Logger['context'], undefined>) => LoggerType
  Context: typeof Logger.Context
}
export type AnalyticsContextType = {
  metadata: Metadata
  logger: LoggerType
  metric: <E extends keyof Metrics>(
    event: E,
    payload: Metrics[E],
    metadata?: MergeableMetadata,
  ) => void
  features: typeof Features & {
    enabled(feature: Features): boolean
  }
}
export type AnalyticsBaseContextType = Omit<AnalyticsContextType, 'features'>

function createLogger(
  context: Logger['context'],
  metadata: Partial<Metadata>,
): LoggerType {
  const logger = Logger.create(context, metadata)
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    log: logger.log.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    useChild: (context: Exclude<Logger['context'], undefined>) => {
      return useMemo(() => createLogger(context, metadata), [context, metadata])
    },
    Context: Logger.Context,
  }
}

const Context = createContext<AnalyticsBaseContextType>({
  logger: createLogger(Logger.Context.Default, {}),
  metric: (event, payload, metadata) => {
    if (metadata && '__meta' in metadata) {
      delete metadata.__meta
    }
    metrics.track(event, payload, {
      ...metadata,
      navigation: getNavigationMetadata(),
    })
  },
  metadata: {
    base: {
      deviceId: getDeviceId() ?? 'unknown',
      sessionId: getInitialSessionId(),
      platform: Platform.OS,
      appVersion: env.APP_VERSION,
      bundleIdentifier: env.BUNDLE_IDENTIFIER,
      bundleDate: env.BUNDLE_DATE,
      referrerSrc: refParams.src,
      referrerUrl: refParams.url,
    },
    geolocation: device.get(['mergedGeolocation']) || {
      countryCode: '',
      regionCode: '',
    },
  },
})

/**
 * Ensures that deviceId is set and migrated from legacy storage. Handled on
 * startup in `App.<platform>.tsx`. This must be awaited prior to the app
 * booting up.
 */
export const setupDeviceId = getAndMigrateDeviceId()

/**
 * Analytics context provider. Decorates the parent analytics context with
 * additional metadata. Nesting should be done carefully and sparingly.
 */
export function AnalyticsContext({
  children,
  metadata,
}: {
  children: React.ReactNode
  metadata?: MergeableMetadata
}) {
  if (metadata) {
    if (!('__meta' in metadata)) {
      throw new Error(
        'Use the useMeta() helper when passing metadata to AnalyticsContext',
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
      base: {
        ...parentContext.metadata.base,
        sessionId,
      },
      geolocation,
    }
    const context: AnalyticsBaseContextType = {
      ...parentContext,
      logger: createLogger(
        Logger.Context.Default,
        getMetadataForLogger(combinedMetadata),
      ),
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

/**
 * Feature gates provider. Decorates the parent analytics context with
 * feature gate capabilities. Should be mounted within `AnalyticsContext`,
 * and below the `<Fragment key={did} />` breaker in `App.<platform>.tsx`.
 */
export function AnalyticsFeaturesContext({
  children,
}: {
  children: React.ReactNode
}) {
  const parentContext = useContext(Context)

  useEffect(() => {
    feats.setTrackingCallback((experiment, result) => {
      parentContext.metric('experiment:viewed', {
        experimentId: experiment.key,
        variationId: result.key,
      })
    })
  }, [parentContext.metric])

  useEffect(() => {
    setAttributes(parentContext.metadata)
  }, [parentContext.metadata])

  const childContext = useMemo<AnalyticsContextType>(() => {
    return {
      ...parentContext,
      features: {
        enabled: feats.isOn.bind(feats),
        ...Features,
      },
    }
  }, [parentContext])

  return <Context.Provider value={childContext}>{children}</Context.Provider>
}

/**
 * Basic analytics context without feature gates. Should really only be used
 * above the `AnalyticsFeaturesContext` provider.
 */
export function useAnalyticsBase() {
  return useContext(Context)
}

/**
 * The main analytics context, including feature gates. Use this everywhere you
 * need metrics, features, or logging within the React tree.
 */
export function useAnalytics() {
  const ctx = useContext(Context)
  if (!('features' in ctx)) {
    throw new Error(
      'useAnalytics must be used within an AnalyticsFeaturesContext',
    )
  }
  return ctx as AnalyticsContextType
}

import {createContext, useContext, useMemo} from 'react'
import {Platform} from 'react-native'
import {type Result} from '@growthbook/growthbook-react'

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
import {plausible} from '#/analytics/plausible'
import {PLAUSIBLE_GOALS} from '#/analytics/plausible/shared'
import * as env from '#/env'
import {useGeolocationServiceResponse} from '#/geolocation/service'
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
    /**
     * All `metric()` calls bubble up to this root handler, so this is the
     * single routing point. When a Plausible domain is configured we forward an
     * allowlisted subset of goals to Plausible (pageviews are auto-captured by
     * the tracker on web; native is disabled). Otherwise we fall back to the
     * primary metrics pipeline. See `#/analytics/plausible`.
     */
    if (env.PLAUSIBLE_DOMAIN) {
      if (PLAUSIBLE_GOALS.has(event)) {
        plausible.track(event, payload, metadata)
      }
      // Non-goal events are not sent to Plausible
    } else {
      // In case of no Plausible domain, we go back to the primary metrics pipeline for all events
      metrics.track(event, payload, {
        ...metadata,
        navigation: getNavigationMetadata(),
      })
    }
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
    geolocation: device.get(['geolocationServiceResponse']) || {
      countryCode: '',
      regionCode: '',
    },
  },
})
Context.displayName = 'AnalyticsContext'

/**
 * Initialize the Plausible sink. No-op when no domain is configured, and safe
 * to call once at module load. On web this sets up the tracker (which then
 * auto-captures pageviews); on native it is a no-op - Plausible is disabled
 * there for now.
 */
plausible.init()

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
  const geolocation = useGeolocationServiceResponse()
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
 * GrowthBook attribute name for the did. Must match the key used in
 * `setAttributes` (`#/analytics/features`) and the assignment unit configured
 * in the GrowthBook dashboard.
 */
const DID_HASH_ATTRIBUTE = 'did'

/**
 * Builds the session metadata override for an exposure event so the event's
 * `did` is sourced from the unit GrowthBook actually bucketed on
 * (`result.hashValue`) rather than from ambient React session metadata. This
 * keeps the `did` and the variation in sync, since both then come from the
 * same evaluation. See APP-2461.
 *
 * Only did-bucketed experiments are overridden. Experiments bucketed on
 * another attribute (e.g. `deviceId`) have a `hashValue` that is not a did, so
 * we leave their session metadata untouched and let the ambient did stand.
 */
function sessionMetadataForResult(
  parentContext: AnalyticsBaseContextType,
  result: Result<unknown>,
): MergeableMetadata | undefined {
  if (result.hashAttribute !== DID_HASH_ATTRIBUTE) return undefined
  const {session} = parentContext.metadata
  if (!session) return undefined
  return {
    session: {
      ...session,
      did: result.hashValue,
    },
  }
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

  /**
   * Side-effects: we need to synchronously set these during the same render
   * cycle. These calls do not trigger re-renders, they just set properties on
   * the singleton GrowthBook instance.
   *
   * Order matters here. We register the tracking callbacks _before_ calling
   * `setAttributes`, because `setAttributes` triggers a synchronous
   * re-evaluation that can fire exposure events. Registering first guarantees
   * those events run through this render's callback (with this render's
   * metadata) rather than a stale callback left over from a previous render,
   * e.g. after an account switch remounts this provider via the
   * `<Fragment key={did} />` breaker in `App.<platform>.tsx`. See APP-2461.
   *
   * We deliberately keep these synchronous rather than moving them into a
   * `useEffect`: `setAttributes` must run before children evaluate gates (or
   * they bucket on the previous account's attributes), and the feature usage
   * callback has no deferred-replay, so a feature evaluated before it is
   * registered would lose its `feature:viewed` event entirely.
   */
  feats.setTrackingCallback((experiment, result) => {
    parentContext.metric(
      'experiment:viewed',
      {
        experimentId: experiment.key,
        variationId: result.key,
      },
      sessionMetadataForResult(parentContext, result),
    )
  })
  feats.setFeatureUsageCallback((feature, result) => {
    parentContext.metric(
      'feature:viewed',
      {
        featureId: feature,
        featureResultValue: result.value,
        experimentId: result.experiment?.key,
        variationId: result.experimentResult?.key,
      },
      result.experimentResult
        ? sessionMetadataForResult(parentContext, result.experimentResult)
        : undefined,
    )
  })
  setAttributes(parentContext.metadata)

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

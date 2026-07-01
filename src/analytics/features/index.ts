import {MMKV} from '@bsky.app/react-native-mmkv'
import {setPolyfills} from '@growthbook/growthbook'
import {GrowthBook} from '@growthbook/growthbook-react'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {Logger} from '#/logger'
import {Features} from '#/analytics/features/types'
import {getNavigationMetadata, type Metadata} from '#/analytics/metadata'
import * as env from '#/env'

export {Features} from '#/analytics/features/types'

const logger = Logger.create(Logger.Context.Growthbook)
const CACHE = new MMKV({id: 'bsky_features_cache'})

const BETA_USER_ATTRIBUTE = 'isBetaUser'

setPolyfills({
  localStorage: {
    getItem: key => {
      return CACHE.getString(key) ?? null
    },
    setItem: (key, value) => {
      CACHE.set(key, value)
    },
  },
})

/**
 * We vary the amount of time we wait for GrowthBook to fetch feature
 * gates based on the strategy specified.
 */
export type FeatureFetchStrategy = 'prefer-low-latency' | 'prefer-fresh-gates'

const TIMEOUT_INIT = 2000 // TODO should base on p99 or something
const TIMEOUT_PREFER_LOW_LATENCY = 250
const TIMEOUT_PREFER_FRESH_GATES = 1500

export const features = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
  enableDevMode: __DEV__,
})

/**
 * Initializer promise that must be awaited before using the GrowthBook
 * instance or rendering the `AnalyticsFeaturesContext`. Note: this may not be
 * fully initialized if it takes longer than `TIMEOUT_INIT` to initialize. In
 * that case, we may see a flash of uncustomized content until the
 * initialization completes.
 */
export const init = features.init({timeout: TIMEOUT_INIT}).then(res => {
  if (!res.success) {
    logger.warn('GrowthBook initialization failed or timed out', {
      source: res.source,
      safeMessage: res.error?.toString(),
    })
  }
})

/**
 * Refresh feature gates from GrowthBook. Updates attributes based on the
 * provided account, if any.
 */
export async function refresh({strategy}: {strategy: FeatureFetchStrategy}) {
  await features.refreshFeatures({
    timeout:
      strategy === 'prefer-low-latency'
        ? TIMEOUT_PREFER_LOW_LATENCY
        : TIMEOUT_PREFER_FRESH_GATES,
  })
}

export function getFeatures() {
  return features.getFeatures()
}

export function getFeatureDescription(feature: Features, i18n: I18n) {
  switch (feature) {
    case Features.PostThreadKnownLikersEnable:
      return {
        key: feature,
        name: i18n._(
          msg({
            message: 'Social proofing on posts',
            comment: 'Name for a feature flag',
          }),
        ),
        description: i18n._(
          msg({
            message: 'Spot posts your friends and follows have liked.',
            comment: 'Description of a feature flag (Social proofing on posts)',
          }),
        ),
      }
    default:
      return null
  }
}

/**
 * Walks a GrowthBook condition tree to determine whether it targets the given
 * attribute. Conditions can nest via the logical operators `$and`, `$or`,
 * `$nor` (arrays of sub-conditions) and `$not` (a single sub-condition), so a
 * flat scan of the top-level keys would miss e.g.
 * `{$and: [{isBetaUser: true}, ...]}`. Dot-notation access (e.g.
 * `isBetaUser.foo`) counts as targeting the attribute as well.
 */
function conditionTargetsAttribute(
  condition: unknown,
  attribute: string,
): boolean {
  if (!condition || typeof condition !== 'object') return false

  for (const [key, value] of Object.entries(condition)) {
    if (key === attribute || key.startsWith(`${attribute}.`)) return true

    if (key === '$and' || key === '$or' || key === '$nor') {
      if (
        Array.isArray(value) &&
        value.some(sub => conditionTargetsAttribute(sub, attribute))
      ) {
        return true
      }
    } else if (key === '$not') {
      if (conditionTargetsAttribute(value, attribute)) return true
    }
  }

  return false
}

export function getTargetedFeatures(i18n: I18n) {
  const allFeatures = features.getFeatures()
  const targetedFeatures: {key: Features; name: string; description: string}[] =
    []
  for (const [featureKey, feature] of Object.entries(allFeatures)) {
    // Check if the feature contains any rules
    if (!feature.rules) continue

    // Determine if any rule targets the beta user attribute
    const hasTargeting = feature.rules.some(rule =>
      conditionTargetsAttribute(rule.condition, BETA_USER_ATTRIBUTE),
    )

    if (hasTargeting) {
      const featureName = getFeatureDescription(featureKey as Features, i18n)
      if (featureName) {
        targetedFeatures.push(featureName)
      }
    }
  }

  return targetedFeatures
}

/**
 * Converts our metadata into GrowthBook attributes and sets them. GrowthBook
 * attributes are manually configured in the GrowthBook dashboard. So these
 * values need to match exactly. Therefore, let's add them here manually to and
 * not spread them to avoid mistakes.
 */
export function setAttributes({
  base,
  geolocation,
  session,
  preferences,
}: Metadata) {
  void features.setAttributes({
    deviceId: base.deviceId,
    sessionId: base.sessionId,
    platform: base.platform,
    appVersion: base.appVersion,
    countryCode: geolocation.countryCode,
    regionCode: geolocation.regionCode,
    did: session?.did,
    isBskyPds: session?.isBskyPds,
    appLanguage: preferences?.appLanguage,
    contentLanguages: preferences?.contentLanguages,
    currentScreen: getNavigationMetadata()?.currentScreen,
    isBetaUser: base.isBetaUser,
  })
}

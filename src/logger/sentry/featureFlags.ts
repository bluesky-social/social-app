import {Sentry} from '#/logger/sentry/lib'

export const featureFlagsIntegration = Sentry.featureFlagsIntegration()

/**
 * Records a feature flag evaluation on Sentry error events and active spans.
 * Sentry currently only supports boolean feature flag values.
 */
export function recordFeatureFlagEvaluation(name: string, value: unknown) {
  if (typeof value === 'boolean') {
    featureFlagsIntegration.addFeatureFlag(name, value)
  }
}

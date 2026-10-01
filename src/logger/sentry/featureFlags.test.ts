import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {
  featureFlagsIntegration,
  recordFeatureFlagEvaluation,
} from '#/logger/sentry/featureFlags'

jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    featureFlagsIntegration: jest.fn(() => ({
      addFeatureFlag: jest.fn(),
    })),
  },
}))

describe('recordFeatureFlagEvaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('records boolean feature flags', () => {
    recordFeatureFlagEvaluation('enabled-flag', true)
    recordFeatureFlagEvaluation('disabled-flag', false)

    expect(featureFlagsIntegration.addFeatureFlag).toHaveBeenNthCalledWith(
      1,
      'enabled-flag',
      true,
    )
    expect(featureFlagsIntegration.addFeatureFlag).toHaveBeenNthCalledWith(
      2,
      'disabled-flag',
      false,
    )
  })

  it.each([['value'], [1], [['value']], [{value: true}], [null], [undefined]])(
    'ignores unsupported value %p',
    value => {
      recordFeatureFlagEvaluation('non-boolean-flag', value)

      expect(featureFlagsIntegration.addFeatureFlag).not.toHaveBeenCalled()
    },
  )
})

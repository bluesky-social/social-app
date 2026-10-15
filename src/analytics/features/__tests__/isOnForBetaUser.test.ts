import {type FeatureRule} from '@growthbook/growthbook'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {Features, features, isOnForBetaUser} from '#/analytics/features'

jest.mock('#/analytics/features/client', () => ({
  createGrowthBook: () => {
    const {GrowthBook: MockGrowthBook} = jest.requireActual<
      typeof import('@growthbook/growthbook')
    >('@growthbook/growthbook')
    return new MockGrowthBook({})
  },
  refreshGrowthBook: jest.fn(),
}))
jest.mock('#/analytics/features/bootstrap', () => ({
  readFeatureBootstrap: () => Promise.resolve(),
}))

const FEATURE = Features.NotificationsV2Enable

async function setRules(
  rules: {id: string; condition?: FeatureRule['condition']}[],
) {
  await features.setPayload({
    features: {
      [FEATURE]: {
        defaultValue: false,
        rules: rules.map(rule => ({...rule, force: true})),
      },
    },
  })
}

describe('isOnForBetaUser', () => {
  beforeEach(async () => {
    await features.setAttributes({isBetaUser: true, did: 'did:plc:someone'})
  })

  it('is true when a rule targeting beta users turned it on', async () => {
    await setRules([{id: 'beta', condition: {isBetaUser: true}}])
    expect(isOnForBetaUser(FEATURE)).toBe(true)
  })

  it('is true for a beta rule nested in a logical operator', async () => {
    await setRules([
      {
        id: 'beta',
        condition: {$and: [{isBetaUser: true}, {did: {$exists: true}}]},
      },
    ])
    expect(isOnForBetaUser(FEATURE)).toBe(true)
  })

  it('is false when another rule turned it on first', async () => {
    await setRules([
      {id: 'rollout', condition: {did: 'did:plc:someone'}},
      {id: 'beta', condition: {isBetaUser: true}},
    ])
    expect(isOnForBetaUser(FEATURE)).toBe(false)
  })

  it('is false when it is off, even for a beta user', async () => {
    await features.setAttributes({isBetaUser: false})
    await setRules([{id: 'beta', condition: {isBetaUser: true}}])
    expect(isOnForBetaUser(FEATURE)).toBe(false)
  })

  it('is false when it is on by default rather than by a rule', async () => {
    await features.setPayload({features: {[FEATURE]: {defaultValue: true}}})
    expect(isOnForBetaUser(FEATURE)).toBe(false)
  })
})

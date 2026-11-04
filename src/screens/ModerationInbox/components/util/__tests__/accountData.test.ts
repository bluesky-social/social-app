import {$output} from '#/lexicons/tools/ozone/inbox/getAccountStatus'
import {getAccountEnforcement, getAccountPreview} from '../accountData'

it('preserves new fields through the current account status schema', () => {
  const data = $output.schema.parse({
    src: 'did:plc:moderation',
    standing: 'atRisk',
    updatedAt: '2026-01-01T00:00:00.000Z',
    enforcement: {state: 'takendown'},
  })
  expect(getAccountEnforcement(data)).toEqual({state: 'takendown'})
})

it('distinguishes account enforcement from strike standing', () => {
  expect(getAccountEnforcement({standing: 'atRisk'})).toBeUndefined()
  expect(
    getAccountEnforcement({standing: 'atRisk', enforcement: {state: 'none'}}),
  ).toEqual({state: 'none'})
  expect(getAccountEnforcement({enforcement: {state: 'takendown'}})).toEqual({
    state: 'takendown',
  })
  expect(
    getAccountEnforcement({
      enforcement: {state: 'suspended', expiresAt: 'not a date'},
    }),
  ).toEqual({state: 'suspended'})
})

it('reads a best-effort profile and accepts missing account data', () => {
  expect(getAccountPreview({})).toBeUndefined()
  expect(getAccountPreview({account: null})).toBeUndefined()
  expect(
    getAccountPreview({
      account: {handle: 'user.test', profile: {displayName: 'User'}},
    }),
  ).toEqual({handle: 'user.test', profile: {displayName: 'User'}})
})

import {describe, expect, it} from '@jest/globals'

import {
  MAX_EXPIRY_RESCUE_GENERATIONS,
  pickExpiryRescueCandidate,
} from '../expiry-rescue'
import {type SessionAccount} from '../types'

function makeAccount(overrides: Partial<SessionAccount> = {}): SessionAccount {
  return {
    service: 'https://bsky.social',
    did: 'did:plc:example123',
    handle: 'alice.test',
    email: 'alice@example.com',
    emailConfirmed: true,
    emailAuthFactor: false,
    refreshJwt: 'refresh-jwt',
    accessJwt: 'access-jwt',
    signupQueued: false,
    active: true,
    status: undefined,
    pdsUrl: undefined,
    isSelfHosted: false,
    ...overrides,
  }
}

describe('pickExpiryRescueCandidate', () => {
  it('picks a candidate whose refreshJwt differs from the dying one', () => {
    const fresh = makeAccount({refreshJwt: 'refresh-jwt-2'})
    const picked = pickExpiryRescueCandidate({
      dyingRefreshJwt: 'refresh-jwt-1',
      candidates: [fresh],
      failedRefreshJwts: new Set(),
    })
    expect(picked).toBe(fresh)
  })

  it('rejects a candidate carrying the dying refreshJwt (equally dead)', () => {
    const picked = pickExpiryRescueCandidate({
      dyingRefreshJwt: 'refresh-jwt-1',
      candidates: [makeAccount({refreshJwt: 'refresh-jwt-1'})],
      failedRefreshJwts: new Set(),
    })
    expect(picked).toBe(undefined)
  })

  it('rejects a candidate with no refreshJwt', () => {
    const picked = pickExpiryRescueCandidate({
      dyingRefreshJwt: 'refresh-jwt-1',
      candidates: [makeAccount({refreshJwt: undefined}), undefined],
      failedRefreshJwts: new Set(),
    })
    expect(picked).toBe(undefined)
  })

  it('rejects a candidate already recorded as failed (loop guard)', () => {
    const picked = pickExpiryRescueCandidate({
      dyingRefreshJwt: 'refresh-jwt-1',
      candidates: [makeAccount({refreshJwt: 'refresh-jwt-2'})],
      failedRefreshJwts: new Set(['refresh-jwt-2']),
    })
    expect(picked).toBe(undefined)
  })

  it('tries candidates in order, preferring the first qualifying one', () => {
    const persistedCandidate = makeAccount({
      refreshJwt: 'refresh-jwt-persisted',
    })
    const reducerCandidate = makeAccount({refreshJwt: 'refresh-jwt-reducer'})
    const picked = pickExpiryRescueCandidate({
      dyingRefreshJwt: 'refresh-jwt-1',
      candidates: [persistedCandidate, reducerCandidate],
      failedRefreshJwts: new Set(),
    })
    expect(picked).toBe(persistedCandidate)
  })

  it('skips an unusable first candidate and falls back to a later one', () => {
    const reducerCandidate = makeAccount({refreshJwt: 'refresh-jwt-reducer'})
    const picked = pickExpiryRescueCandidate({
      dyingRefreshJwt: 'refresh-jwt-1',
      candidates: [
        makeAccount({refreshJwt: 'refresh-jwt-1'}),
        reducerCandidate,
      ],
      failedRefreshJwts: new Set(),
    })
    expect(picked).toBe(reducerCandidate)
  })

  it('gives up once the failed-generation set hits the hard cap', () => {
    const failed = new Set<string>()
    for (let i = 0; i < MAX_EXPIRY_RESCUE_GENERATIONS; i++) {
      failed.add(`refresh-jwt-failed-${i}`)
    }
    const picked = pickExpiryRescueCandidate({
      dyingRefreshJwt: 'refresh-jwt-dying',
      candidates: [makeAccount({refreshJwt: 'refresh-jwt-brand-new'})],
      failedRefreshJwts: failed,
    })
    expect(picked).toBe(undefined)
  })
})

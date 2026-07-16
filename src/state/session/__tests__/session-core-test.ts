import {type SessionData} from '@atproto/lex-password-session'

import {type SessionAccount} from '../types'

jest.mock('#/state/events', () => ({
  emitNetworkConfirmed: jest.fn(),
  emitNetworkLost: jest.fn(),
}))

/*
 * session-core now imports the factory dependency graph (birthdate,
 * restrictChatSettings, ageAssurance, moderation). Mock the heavy leaves so the
 * pure-converter tests here stay lightweight and do not pull in the native
 * bottom-sheet module chain (same approach as session-test.ts).
 */
jest.mock('#/state/birthdate')
jest.mock('#/ageAssurance/data')
jest.mock('#/ageAssurance/state', () => ({
  unsafeGetAndComputeAgeAssurance: () => ({state: {}, flags: {}}),
}))
jest.mock('#/state/queries/messages/restrictChatSettings', () => ({
  restrictChatSettings: () => Promise.resolve(),
}))

jest.mock('jwt-decode', () => ({
  jwtDecode(token: string) {
    if (token === 'queued-access-jwt') {
      return {scope: 'com.atproto.signupQueued'}
    }
    return {scope: 'com.atproto.access'}
  },
}))

import {
  extractPdsUrl,
  sessionAccountToSessionData,
  sessionDataToSessionAccount,
  synthDidDoc,
} from '../session-core'

const DID = 'did:plc:example123'
const HANDLE = 'alice.test'
const PDS_URL = 'https://shimeji.us-east.host.bsky.network'

function makeSessionData(overrides: Partial<SessionData> = {}): SessionData {
  return {
    accessJwt: 'access-jwt',
    refreshJwt: 'refresh-jwt',
    handle: HANDLE,
    did: DID,
    email: 'alice@example.com',
    emailConfirmed: true,
    emailAuthFactor: false,
    active: true,
    service: 'https://bsky.social',
    ...overrides,
  }
}

describe('extractPdsUrl', () => {
  it('extracts the PDS endpoint from a didDoc', () => {
    expect(extractPdsUrl(synthDidDoc(DID, PDS_URL))).toBe(PDS_URL)
  })

  it('matches full service ids ending in #atproto_pds', () => {
    const didDoc = {
      id: DID,
      service: [
        {
          id: `${DID}#atproto_pds`,
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: PDS_URL,
        },
      ],
    }
    expect(extractPdsUrl(didDoc)).toBe(PDS_URL)
  })

  it('returns null for missing/invalid input', () => {
    expect(extractPdsUrl(undefined)).toBe(null)
    expect(extractPdsUrl(null)).toBe(null)
    expect(extractPdsUrl({})).toBe(null)
    expect(extractPdsUrl({service: 'not-an-array'})).toBe(null)
    expect(
      extractPdsUrl({
        service: [{id: '#other_service', serviceEndpoint: PDS_URL}],
      }),
    ).toBe(null)
    expect(
      extractPdsUrl({service: [{id: '#atproto_pds', serviceEndpoint: 42}]}),
    ).toBe(null)
    expect(
      extractPdsUrl({
        service: [{id: '#atproto_pds', serviceEndpoint: 'not a url'}],
      }),
    ).toBe(null)
  })
})

describe('synthDidDoc', () => {
  it('produces a didDoc that extractPdsUrl round-trips', () => {
    const doc = synthDidDoc(DID, PDS_URL)
    expect(extractPdsUrl(doc)).toBe(PDS_URL)
    expect(doc.id).toBe(DID)
  })
})

describe('sessionDataToSessionAccount', () => {
  it('returns undefined for a missing session', () => {
    expect(sessionDataToSessionAccount(undefined, 'https://bsky.social')).toBe(
      undefined,
    )
    expect(sessionDataToSessionAccount(null, 'https://bsky.social')).toBe(
      undefined,
    )
  })

  it('maps fields for a hosted account (no didDoc)', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(account).toEqual({
      service: 'https://bsky.social/',
      did: DID,
      handle: HANDLE,
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
    })
  })

  it('normalizes service with a trailing slash like agent.serviceUrl.toString()', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(account.service).toBe('https://bsky.social/')
  })

  it('derives pdsUrl from the didDoc, normalized as a URL string', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: synthDidDoc(DID, PDS_URL)}),
      'https://bsky.social',
    )!
    /*
     * The old code read agent.pdsUrl?.toString() - a URL - so the persisted
     * value carries a trailing slash.
     */
    expect(account.pdsUrl).toBe(`${PDS_URL}/`)
  })

  it('leaves pdsUrl undefined for hosted accounts (no service fallback)', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: undefined}),
      'https://bsky.social',
    )!
    expect(account.pdsUrl).toBe(undefined)
  })

  it('derives isSelfHosted from the service URL', () => {
    const hosted = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(hosted.isSelfHosted).toBe(false)

    const selfHosted = sessionDataToSessionAccount(
      makeSessionData({service: 'https://pds.example.com'}),
      'https://pds.example.com',
    )!
    expect(selfHosted.isSelfHosted).toBe(true)
  })

  it('derives signupQueued from the access token scope', () => {
    const queued = sessionDataToSessionAccount(
      makeSessionData({accessJwt: 'queued-access-jwt'}),
      'https://bsky.social',
    )!
    expect(queued.signupQueued).toBe(true)

    const notQueued = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(notQueued.signupQueued).toBe(false)
  })

  it('coerces missing email flags to false', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({
        email: undefined,
        emailConfirmed: undefined,
        emailAuthFactor: undefined,
      }),
      'https://bsky.social',
    )!
    expect(account.email).toBe(undefined)
    expect(account.emailConfirmed).toBe(false)
    expect(account.emailAuthFactor).toBe(false)
  })

  it('preserves the exact field order of the old agentToSessionAccount literal', () => {
    /*
     * Byte-stability guard: the reducer's JSON.stringify fast path and the
     * session test snapshots depend on this exact key order. This is the
     * object literal order of the old agentToSessionAccount in agent.ts.
     */
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: synthDidDoc(DID, PDS_URL)}),
      'https://bsky.social',
    )!
    const golden: SessionAccount = {
      service: 'https://bsky.social/',
      did: DID,
      handle: HANDLE,
      email: 'alice@example.com',
      emailConfirmed: true,
      emailAuthFactor: false,
      refreshJwt: 'refresh-jwt',
      accessJwt: 'access-jwt',
      signupQueued: false,
      active: true,
      status: undefined,
      pdsUrl: `${PDS_URL}/`,
      isSelfHosted: false,
    }
    expect(Object.keys(account)).toEqual(Object.keys(golden))
    expect(JSON.stringify(account)).toBe(JSON.stringify(golden))
  })
})

describe('sessionAccountToSessionData', () => {
  const baseAccount: SessionAccount = {
    service: 'https://bsky.social/',
    did: DID,
    handle: HANDLE,
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
  }

  it('maps fields with empty-string token fallbacks and active default', () => {
    const data = sessionAccountToSessionData({
      ...baseAccount,
      accessJwt: undefined,
      refreshJwt: undefined,
      active: undefined,
    })
    expect(data.accessJwt).toBe('')
    expect(data.refreshJwt).toBe('')
    expect(data.active).toBe(true)
    expect(data.did).toBe(DID)
    expect(data.handle).toBe(HANDLE)
    expect(data.service).toBe('https://bsky.social/')
  })

  it('omits didDoc when the account has no stored pdsUrl', () => {
    const data = sessionAccountToSessionData(baseAccount)
    expect('didDoc' in data).toBe(false)
    expect(extractPdsUrl(data.didDoc)).toBe(null)
  })

  it('synthesizes a didDoc from a stored pdsUrl so PDS routing works pre-refresh', () => {
    const data = sessionAccountToSessionData({
      ...baseAccount,
      pdsUrl: `${PDS_URL}/`,
    })
    expect(extractPdsUrl(data.didDoc)).toBe(`${PDS_URL}/`)
  })

  it('round-trips account -> SessionData -> account preserving all fields', () => {
    const withPds: SessionAccount = {
      ...baseAccount,
      pdsUrl: `${PDS_URL}/`,
    }
    for (const account of [baseAccount, withPds]) {
      const data = sessionAccountToSessionData(account)
      const roundTripped = sessionDataToSessionAccount(data, account.service)!
      expect(roundTripped).toEqual(account)
      expect(JSON.stringify(roundTripped)).toBe(JSON.stringify(account))
    }
  })

  it('round-trips signupQueued via the access token scope', () => {
    const queued: SessionAccount = {
      ...baseAccount,
      accessJwt: 'queued-access-jwt',
      signupQueued: true,
    }
    const roundTripped = sessionDataToSessionAccount(
      sessionAccountToSessionData(queued),
      queued.service,
    )!
    expect(roundTripped.signupQueued).toBe(true)
    expect(roundTripped).toEqual(queued)
  })

  it('round-trips a self-hosted account', () => {
    const selfHosted: SessionAccount = {
      ...baseAccount,
      service: 'https://pds.example.com/',
      pdsUrl: 'https://pds.example.com/',
      isSelfHosted: true,
    }
    const roundTripped = sessionDataToSessionAccount(
      sessionAccountToSessionData(selfHosted),
      selfHosted.service,
    )!
    expect(roundTripped).toEqual(selfHosted)
  })
})

import {beforeEach, describe, expect, it, jest} from '@jest/globals'

jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>()
  return {
    AFTER_FIRST_UNLOCK: 0,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    __mock: {values},
  }
})

jest.mock('#/state/persisted', () => {
  const schema: typeof import('#/state/persisted/schema') = require('#/state/persisted/schema')
  const state: Record<string, unknown> = {...schema.defaults}
  return {
    defaults: schema.defaults,
    get: (key: string) => state[key],
    readLatest: (key: string) => state[key],
    write: (key: string, value: unknown) => {
      state[key] = value
      return Promise.resolve()
    },
    onUpdate: () => () => {},
    __state: state,
  }
})

jest.mock('#/logger', () => {
  const noop = () => {}
  const instance = {
    debug: noop,
    info: noop,
    log: noop,
    warn: noop,
    error: noop,
  }
  return {
    Logger: {Context: {Session: 'session'}, create: () => instance},
    logger: instance,
  }
})

import {type Schema} from '#/state/persisted'
import {type SessionAccount} from '#/state/session/types'
import {device} from '#/storage'
import {
  type BootDecision,
  decideBootSource,
  type SecureRead,
  type SessionStorageBootReport,
} from '../boot'
import {consumeSessionStorageBootReport, initSessionStorage} from '../index'
import {SESSION_INSTALL_KEY} from '../keys'
import {EMPTY_SNAPSHOT, type SessionSnapshot} from '../schema'
import {readSessions, writeInstallMarker, writeSessions} from '../secureStore'

const {__mock: secure} = jest.requireMock('expo-secure-store') as {
  __mock: {values: Map<string, string>}
}
const persistedState = (
  jest.requireMock('#/state/persisted') as {__state: Schema}
).__state

const alice: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:alice',
  handle: 'alice.test',
  refreshJwt: 'alice-refresh',
  accessJwt: 'alice-access',
}
const expiredAlice: SessionAccount = {
  ...alice,
  refreshJwt: undefined,
  accessJwt: undefined,
}
const bob: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:bob',
  handle: 'bob.test',
  refreshJwt: 'bob-refresh',
  accessJwt: 'bob-access',
}

/**
 * A minimal unsigned JWT carrying an `iat`. `jwt-decode` reads the payload
 * without verifying anything, so the signature can be junk. `jti` is there to
 * make two tokens of the same age differ as strings.
 */
function jwtWithIat(iat: number, jti = 'a'): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return [
    encode({alg: 'HS256', typ: 'JWT'}),
    encode({iat, jti}),
    'not-a-signature',
  ].join('.')
}

/** An account with usable credentials. */
const withCreds: SessionSnapshot = {accounts: [alice], currentDid: alice.did}
/** The same account, logged out or expired. */
const withoutCreds: SessionSnapshot = {
  accounts: [expiredAlice],
  currentDid: alice.did,
}

type ExpectedDecision = Omit<BootDecision, 'adopt' | 'report'> & {
  adopts: boolean
  divergence: SessionStorageBootReport['divergence']
  /**
   * The adopted snapshot, when the per-account merge makes it something other
   * than the secure snapshot as read.
   */
  adopt?: SessionSnapshot
  adoptTokensFromLegacy?: number
}

const rows: {
  name: string
  gateEnabled: boolean
  secure: SecureRead
  legacy: SessionSnapshot
  expected: ExpectedDecision
}[] = [
  {
    name: 'gate off, nothing stored yet',
    gateEnabled: false,
    secure: {status: 'missing'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: true,
      divergence: 'none',
    },
  },
  {
    name: 'gate off, both stores agree',
    gateEnabled: false,
    secure: {status: 'ok', snapshot: withCreds},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: false,
      divergence: 'none',
    },
  },
  {
    name: 'gate off, the blob lost its credentials',
    gateEnabled: false,
    secure: {status: 'ok', snapshot: withCreds},
    legacy: withoutCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: false,
      divergence: 'legacy-lost',
    },
  },
  {
    name: 'gate off, the secure store is behind',
    gateEnabled: false,
    secure: {status: 'ok', snapshot: withoutCreds},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: false,
      divergence: 'secure-behind',
    },
  },
  {
    name: 'gate off, stored data is unreadable',
    gateEnabled: false,
    secure: {status: 'invalid'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: true,
      divergence: 'none',
    },
  },
  {
    name: 'gate off, the keychain is unreachable',
    gateEnabled: false,
    secure: {status: 'unavailable'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'none',
      forceIndex: false,
      divergence: 'none',
    },
  },
  {
    name: 'gate off, data from a previous install',
    gateEnabled: false,
    secure: {status: 'foreign-install'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: true,
      divergence: 'none',
    },
  },
  {
    name: 'gate on, nothing stored yet',
    gateEnabled: true,
    secure: {status: 'missing'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: true,
      divergence: 'none',
    },
  },
  {
    name: 'gate on, stored data is unreadable',
    gateEnabled: true,
    secure: {status: 'invalid'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: true,
      divergence: 'none',
    },
  },
  {
    name: 'gate on, both stores agree',
    gateEnabled: true,
    secure: {status: 'ok', snapshot: withCreds},
    legacy: withCreds,
    expected: {
      source: 'secure',
      adopts: true,
      backfill: 'none',
      forceIndex: false,
      divergence: 'none',
    },
  },
  {
    name: 'gate on, the blob lost its credentials',
    gateEnabled: true,
    secure: {status: 'ok', snapshot: withCreds},
    legacy: withoutCreds,
    expected: {
      source: 'secure',
      adopts: true,
      backfill: 'none',
      forceIndex: false,
      divergence: 'legacy-lost',
    },
  },
  {
    name: 'gate on, neither store holds credentials',
    gateEnabled: true,
    secure: {status: 'ok', snapshot: EMPTY_SNAPSHOT},
    legacy: withoutCreds,
    expected: {
      source: 'secure',
      adopts: true,
      // The merge keeps the credential-less account the blob still lists.
      adopt: withoutCreds,
      backfill: 'none',
      forceIndex: false,
      divergence: 'none',
    },
  },
  {
    name: 'gate on, the secure store is behind',
    gateEnabled: true,
    secure: {status: 'ok', snapshot: withoutCreds},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: false,
      divergence: 'secure-behind',
    },
  },
  {
    name: 'gate on, the keychain is unreachable',
    gateEnabled: true,
    secure: {status: 'unavailable'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'none',
      forceIndex: false,
      divergence: 'none',
    },
  },
  {
    name: 'gate on, data from a previous install',
    gateEnabled: true,
    secure: {status: 'foreign-install'},
    legacy: withCreds,
    expected: {
      source: 'legacy',
      adopts: false,
      backfill: 'secure-from-legacy',
      forceIndex: true,
      divergence: 'none',
    },
  },
]

describe('decideBootSource', () => {
  it.each(rows)('$name', ({gateEnabled, secure: read, legacy, expected}) => {
    const {
      adopt: expectedAdopt,
      adoptTokensFromLegacy = 0,
      ...expectedCore
    } = expected
    const decision = decideBootSource({gateEnabled, secure: read, legacy})

    expect({
      source: decision.source,
      adopts: decision.adopt !== undefined,
      backfill: decision.backfill,
      forceIndex: decision.forceIndex,
      divergence: decision.report.divergence,
    }).toEqual(expectedCore)
    expect(decision.adopt).toEqual(
      expected.adopts
        ? (expectedAdopt ?? (read.status === 'ok' ? read.snapshot : undefined))
        : undefined,
    )
    expect(decision.report.adoptTokensFromLegacy).toBe(adoptTokensFromLegacy)
    expect(decision.report.gateEnabled).toBe(gateEnabled)
    expect(decision.report.secureStatus).toBe(read.status)
    expect(decision.report.source).toBe(expected.source)
  })

  it('counts the accounts holding credentials in each store', () => {
    const {report} = decideBootSource({
      gateEnabled: false,
      secure: {
        status: 'ok',
        snapshot: {
          accounts: [alice, {...expiredAlice, did: 'did:plc:bob'}],
          currentDid: alice.did,
        },
      },
      legacy: withoutCreds,
    })

    expect(report.secureAccountsWithCreds).toBe(1)
    expect(report.legacyAccountsWithCreds).toBe(0)
  })
})

/**
 * Adopting the secure store wholesale would lose whatever only the blob holds,
 * which is what a single failed mirror write looks like: the store as a whole
 * still has credentials, so the whole-store guard sees nothing wrong.
 */
describe('decideBootSource credential merge', () => {
  function adoptedBy(secureSnapshot: SessionSnapshot, legacy: SessionSnapshot) {
    return decideBootSource({
      gateEnabled: true,
      secure: {status: 'ok', snapshot: secureSnapshot},
      legacy,
    })
  }

  it('keeps an account the secure store never received', () => {
    const legacy: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }

    const decision = adoptedBy(withCreds, legacy)

    expect(decision.source).toBe('secure')
    expect(decision.adopt).toEqual(legacy)
    expect(decision.report.adoptTokensFromLegacy).toBe(1)
  })

  it('keeps an account only the secure store still holds', () => {
    const secureSnapshot: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: bob.did,
    }

    const decision = adoptedBy(secureSnapshot, withCreds)

    expect(decision.adopt).toEqual(secureSnapshot)
    expect(decision.report.adoptTokensFromLegacy).toBe(0)
  })

  it('takes whichever refresh token was issued last', () => {
    const older = {...alice, refreshJwt: jwtWithIat(1_000), accessJwt: 'older'}
    const newer = {...alice, refreshJwt: jwtWithIat(2_000), accessJwt: 'newer'}
    const snapshotOf = (account: SessionAccount): SessionSnapshot => ({
      accounts: [account],
      currentDid: alice.did,
    })

    const legacyIsNewer = adoptedBy(snapshotOf(older), snapshotOf(newer))
    expect(legacyIsNewer.adopt).toEqual(snapshotOf(newer))
    expect(legacyIsNewer.report.adoptTokensFromLegacy).toBe(1)

    const secureIsNewer = adoptedBy(snapshotOf(newer), snapshotOf(older))
    expect(secureIsNewer.adopt).toEqual(snapshotOf(newer))
    expect(secureIsNewer.report.adoptTokensFromLegacy).toBe(0)
  })

  it('falls back to the blob when the comparison cannot be made', () => {
    const snapshotOf = (account: SessionAccount): SessionSnapshot => ({
      accounts: [account],
      currentDid: alice.did,
    })
    const undecodable = {...alice, refreshJwt: 'not-a-jwt'}
    const decodable = {...alice, refreshJwt: jwtWithIat(1_000)}
    const sameAge = {...alice, refreshJwt: jwtWithIat(1_000, 'b')}

    const unreadable = adoptedBy(snapshotOf(undecodable), snapshotOf(decodable))
    expect(unreadable.adopt).toEqual(snapshotOf(decodable))
    expect(unreadable.report.adoptTokensFromLegacy).toBe(1)

    const tied = adoptedBy(snapshotOf(decodable), snapshotOf(sameAge))
    expect(tied.adopt).toEqual(snapshotOf(sameAge))
  })
})

describe('initSessionStorage', () => {
  beforeEach(() => {
    secure.values.clear()
    persistedState.session = {accounts: [], currentAccount: undefined}
    device.set(['sessionSecureStorageInstallId'], 'install-1')
    writeInstallMarker('install-1')
    consumeSessionStorageBootReport()
  })

  it('adopts the secure store into the persisted state when it wins', () => {
    device.set(['sessionSecureStorageReadEnabled'], true)
    writeSessions(EMPTY_SNAPSHOT, withCreds, {forceIndex: true})
    persistedState.session = {
      accounts: [expiredAlice],
      currentAccount: expiredAlice,
    }

    initSessionStorage()

    expect(persistedState.session).toEqual({
      accounts: [alice],
      currentAccount: alice,
    })
    expect(consumeSessionStorageBootReport()).toEqual({
      source: 'secure',
      gateEnabled: true,
      secureStatus: 'ok',
      divergence: 'legacy-lost',
      secureAccountsWithCreds: 1,
      legacyAccountsWithCreds: 0,
      adoptTokensFromLegacy: 0,
    })
  })

  it('adopts the newer blob credential and converges the store on it', () => {
    device.set(['sessionSecureStorageReadEnabled'], true)
    const stored = {
      ...alice,
      refreshJwt: jwtWithIat(1_000),
      accessJwt: 'stored-access',
    }
    const refreshed = {
      ...alice,
      refreshJwt: jwtWithIat(2_000),
      accessJwt: 'refreshed-access',
    }
    writeSessions(
      EMPTY_SNAPSHOT,
      {accounts: [stored], currentDid: alice.did},
      {forceIndex: true},
    )
    persistedState.session = {
      accounts: [refreshed],
      currentAccount: refreshed,
    }

    initSessionStorage()

    expect(persistedState.session).toEqual({
      accounts: [refreshed],
      currentAccount: refreshed,
    })
    // The mirror write lands the adopted credential back in the keychain.
    expect(readSessions()).toEqual({
      accounts: [refreshed],
      currentDid: alice.did,
    })
    expect(consumeSessionStorageBootReport()).toMatchObject({
      source: 'secure',
      divergence: 'none',
      adoptTokensFromLegacy: 1,
    })
  })

  it('rewrites from the blob instead of adopting a store that fell behind', () => {
    device.set(['sessionSecureStorageReadEnabled'], true)
    writeSessions(EMPTY_SNAPSHOT, withoutCreds, {forceIndex: true})
    persistedState.session = {accounts: [alice], currentAccount: alice}

    initSessionStorage()

    expect(persistedState.session).toEqual({
      accounts: [alice],
      currentAccount: alice,
    })
    expect(readSessions()).toEqual(withCreds)
    expect(consumeSessionStorageBootReport()).toMatchObject({
      source: 'legacy',
      divergence: 'secure-behind',
    })
  })

  it('erases sessions belonging to a previous install', () => {
    device.set(['sessionSecureStorageReadEnabled'], true)
    writeSessions(EMPTY_SNAPSHOT, withCreds, {forceIndex: true})
    // The keychain outlived the install that wrote it.
    writeInstallMarker('install-0')

    initSessionStorage()

    expect(persistedState.session).toEqual({
      accounts: [],
      currentAccount: undefined,
    })
    expect(readSessions()).toEqual(EMPTY_SNAPSHOT)
    expect(secure.values.get(SESSION_INSTALL_KEY)).toBe('install-1')
    expect(consumeSessionStorageBootReport()).toMatchObject({
      source: 'legacy',
      secureStatus: 'foreign-install',
    })
  })
})

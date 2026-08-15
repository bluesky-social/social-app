import {beforeEach, describe, expect, it, jest} from '@jest/globals'

/*
 * A real in-memory keychain, with a way to make one key fail. Everything the
 * test drives lives inside the factory so it is safe to touch from the very
 * first module evaluation.
 */
jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>()
  const writes: [key: string, value: string][] = []
  const options: unknown[] = []
  const control: {failKey?: string} = {}
  return {
    AFTER_FIRST_UNLOCK: 0,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string, opts?: unknown) => {
      if (key === control.failKey) throw new Error('disk full')
      writes.push([key, value])
      options.push(opts)
      values.set(key, value)
    },
    __mock: {values, writes, options, control},
  }
})

import * as SecureStore from 'expo-secure-store'

import {type SessionAccount} from '#/state/session/types'
import {accountKeys, SESSION_INDEX_KEY} from '../keys'
import {EMPTY_SNAPSHOT, type SessionSnapshot} from '../schema'
import {
  eraseSessions,
  hasStoredIndex,
  readSessions,
  writeSessions,
} from '../secureStore'

const {__mock: secure} = jest.requireMock('expo-secure-store') as {
  __mock: {
    values: Map<string, string>
    writes: [key: string, value: string][]
    options: unknown[]
    control: {failKey?: string}
  }
}

const alice: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:alice',
  handle: 'alice.test',
  refreshJwt: 'alice-refresh',
  accessJwt: 'alice-access',
}
const aliceKeys = accountKeys(alice.did)
const active: SessionSnapshot = {accounts: [alice], currentDid: alice.did}

beforeEach(() => {
  secure.values.clear()
  secure.writes.length = 0
  secure.options.length = 0
  secure.control.failKey = undefined
})

function writtenKeys() {
  return secure.writes.map(([key]) => key)
}

describe('secureStore', () => {
  it('writes credentials before descriptors and publishes the index last', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})

    expect(writtenKeys()).toEqual([
      aliceKeys.refresh,
      aliceKeys.access,
      aliceKeys.descriptor,
      SESSION_INDEX_KEY,
    ])
    expect(hasStoredIndex()).toBe(true)
    expect(readSessions()).toEqual(active)
  })

  it('derives keys that fit the storage grammar and hide the did', () => {
    const keys = accountKeys('did:web:example.com:some/path?with=chars')

    for (const key of Object.values(keys)) {
      expect(key).toMatch(/^[A-Za-z0-9._-]+$/)
      expect(key).not.toContain('example.com')
    }
  })

  it('writes every key so it survives a locked device', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})

    expect(secure.options.length).toBe(secure.writes.length)
    for (const options of secure.options) {
      expect(options).toEqual({
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      })
    }
  })

  it('journals a retained-account logout against the previous index', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})
    secure.writes.length = 0

    const loggedOut: SessionSnapshot = {
      accounts: [{...alice, refreshJwt: undefined, accessJwt: undefined}],
      currentDid: undefined,
    }
    writeSessions(active, loggedOut)

    expect(secure.writes).toEqual([
      [
        SESSION_INDEX_KEY,
        JSON.stringify({
          version: 1,
          currentDid: alice.did,
          dids: [alice.did],
          revokedDids: [alice.did],
        }),
      ],
      [aliceKeys.refresh, ''],
      [aliceKeys.access, ''],
      [
        SESSION_INDEX_KEY,
        JSON.stringify({version: 1, currentDid: undefined, dids: [alice.did]}),
      ],
    ])
    expect(readSessions()).toEqual(loggedOut)
  })

  it('journals a removed account, then tombstones it, then cleans the index', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})
    secure.writes.length = 0

    writeSessions(active, EMPTY_SNAPSHOT)

    expect(secure.writes).toEqual([
      [
        SESSION_INDEX_KEY,
        JSON.stringify({
          version: 1,
          currentDid: undefined,
          dids: [],
          retiredDids: [alice.did],
        }),
      ],
      [aliceKeys.refresh, ''],
      [aliceKeys.access, ''],
      [aliceKeys.descriptor, ''],
      [
        SESSION_INDEX_KEY,
        JSON.stringify({version: 1, currentDid: undefined, dids: []}),
      ],
    ])
    expect(readSessions()).toEqual(EMPTY_SNAPSHOT)
  })

  it('finishes an interrupted credential revocation on read', () => {
    const {
      accessJwt: _accessJwt,
      refreshJwt: _refreshJwt,
      ...descriptor
    } = alice
    secure.values.set(aliceKeys.refresh, '')
    secure.values.set(aliceKeys.access, alice.accessJwt!)
    secure.values.set(aliceKeys.descriptor, JSON.stringify(descriptor))
    secure.values.set(
      SESSION_INDEX_KEY,
      JSON.stringify({
        version: 1,
        dids: [alice.did],
        revokedDids: [alice.did],
      }),
    )

    expect(readSessions()).toEqual({
      accounts: [{...descriptor, refreshJwt: undefined, accessJwt: undefined}],
      currentDid: undefined,
    })
    expect(secure.values.get(aliceKeys.access)).toBe('')
    expect(JSON.parse(secure.values.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      dids: [alice.did],
    })
  })

  it('finishes an interrupted account removal on read', () => {
    secure.values.set(aliceKeys.refresh, alice.refreshJwt!)
    secure.values.set(aliceKeys.access, alice.accessJwt!)
    secure.values.set(aliceKeys.descriptor, JSON.stringify(alice))
    secure.values.set(
      SESSION_INDEX_KEY,
      JSON.stringify({
        version: 1,
        dids: [],
        retiredDids: [alice.did],
      }),
    )

    expect(readSessions()).toEqual(EMPTY_SNAPSHOT)
    expect(secure.values.get(aliceKeys.refresh)).toBe('')
    expect(secure.values.get(aliceKeys.access)).toBe('')
    expect(secure.values.get(aliceKeys.descriptor)).toBe('')
    expect(JSON.parse(secure.values.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      dids: [],
    })
  })

  it('erases an account and resets the index', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})
    secure.writes.length = 0

    eraseSessions([alice.did])

    expect(secure.writes).toEqual([
      [
        SESSION_INDEX_KEY,
        JSON.stringify({
          version: 1,
          currentDid: undefined,
          dids: [],
          retiredDids: [alice.did],
        }),
      ],
      [aliceKeys.refresh, ''],
      [aliceKeys.access, ''],
      [aliceKeys.descriptor, ''],
      [
        SESSION_INDEX_KEY,
        JSON.stringify({version: 1, currentDid: undefined, dids: []}),
      ],
    ])
    expect(readSessions()).toEqual(EMPTY_SNAPSHOT)
  })

  it('treats the index as the commit point when a write is interrupted', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})
    const bob: SessionAccount = {
      service: 'https://bsky.social',
      did: 'did:plc:bob',
      handle: 'bob.test',
      refreshJwt: 'bob-refresh',
      accessJwt: 'bob-access',
    }
    secure.control.failKey = SESSION_INDEX_KEY

    expect(() =>
      writeSessions(active, {accounts: [alice, bob], currentDid: alice.did}),
    ).toThrow('disk full')

    secure.control.failKey = undefined
    // bob's credentials landed, but no index ever named him.
    expect(secure.values.get(accountKeys(bob.did).refresh)).toBe('bob-refresh')
    expect(readSessions()).toEqual(active)
  })

  it('treats a key-reordered equivalent snapshot as unchanged', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})
    /*
     * A snapshot read back carries the schema's key order while one built by
     * the reducer carries its own, so this is the shape of every first write
     * after a boot.
     */
    const previous = readSessions()
    secure.writes.length = 0

    writeSessions(previous, {
      currentDid: alice.did,
      accounts: [
        {
          did: alice.did,
          handle: alice.handle,
          service: alice.service,
          accessJwt: alice.accessJwt,
          refreshJwt: alice.refreshJwt,
        },
      ],
    })

    expect(secure.writes).toEqual([])
  })

  it('does not republish the index when nothing changed', () => {
    writeSessions(EMPTY_SNAPSHOT, active, {forceIndex: true})
    secure.writes.length = 0

    writeSessions(active, active)

    expect(secure.writes).toEqual([])
  })
})

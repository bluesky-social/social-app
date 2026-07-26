import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

import {WebSessionRepository} from '../repository.web'
import {type SessionAccount, type SessionSnapshot} from '../schema'

const STORAGE_KEY = 'BSKY_SESSION_STORAGE_V1'
const values = new Map<string, string>()
let failRead = false
let failWrite = false
let lockQueue = Promise.resolve<unknown>(undefined)

const storageLocks = {
  request: jest.fn((_name: string, callback: () => unknown) => {
    const result = lockQueue.then(callback)
    lockQueue = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }),
}

const storage = {
  getItem: jest.fn((key: string) => {
    if (failRead) throw new Error('localStorage unavailable')
    return values.get(key) ?? null
  }),
  setItem: jest.fn((key: string, value: string) => {
    if (failWrite) throw new Error('localStorage unavailable')
    values.set(key, value)
  }),
}

const alice: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:alice',
  handle: 'alice.test',
  refreshJwt: 'alice-refresh',
  accessJwt: 'alice-access',
  emailConfirmed: false,
}
const bob: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:bob',
  handle: 'bob.test',
  refreshJwt: 'bob-refresh',
  accessJwt: 'bob-access',
}
const charlie: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:charlie',
  handle: 'charlie.test',
  refreshJwt: 'charlie-refresh',
  accessJwt: 'charlie-access',
}

beforeEach(() => {
  jest.useFakeTimers()
  values.clear()
  failRead = false
  failWrite = false
  lockQueue = Promise.resolve(undefined)
  storageLocks.request.mockClear()
  storage.getItem.mockClear()
  storage.setItem.mockClear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })
  Object.defineProperty(globalThis.navigator, 'locks', {
    configurable: true,
    value: storageLocks,
  })
  if (!globalThis.window) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    })
  }
  Object.defineProperty(globalThis.window, 'addEventListener', {
    configurable: true,
    value: jest.fn(),
  })
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

describe('WebSessionRepository', () => {
  it('repairs corrupt storage and starts logged out', async () => {
    values.set(STORAGE_KEY, '{invalid json')
    const repository = new WebSessionRepository()

    await expect(
      repository.open({accounts: [alice], currentDid: alice.did}),
    ).resolves.toEqual({
      status: 'ready',
      snapshot: {accounts: [], currentDid: undefined},
      shouldScrubLegacy: true,
    })
    expect(readStoredSnapshot()).toEqual({accounts: []})
  })

  it('keeps a legacy session in memory when localStorage is unavailable', async () => {
    failRead = true
    failWrite = true
    const repository = new WebSessionRepository()
    const legacy = {accounts: [alice], currentDid: alice.did}

    await expect(repository.open(legacy)).resolves.toEqual({
      status: 'ready',
      snapshot: legacy,
      shouldScrubLegacy: false,
    })
    expect(repository.getSnapshot()).toEqual(legacy)
  })

  it('rebases local changes onto a newer snapshot from another tab', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const repository = new WebSessionRepository()
    await repository.open(previous)

    const latest: SessionSnapshot = {
      accounts: [
        {...alice, refreshJwt: 'fresh-refresh', accessJwt: 'fresh-access'},
        bob,
        charlie,
      ],
      currentDid: charlie.did,
    }
    values.set(STORAGE_KEY, JSON.stringify(latest))

    const next: SessionSnapshot = {
      accounts: [{...alice, emailConfirmed: true}],
      currentDid: alice.did,
    }
    await expect(repository.commit(previous, next)).resolves.toEqual({
      status: 'committed',
    })

    expect(readStoredSnapshot()).toEqual({
      accounts: [
        {
          ...alice,
          refreshJwt: 'fresh-refresh',
          accessJwt: 'fresh-access',
          emailConfirmed: true,
        },
        charlie,
      ],
      currentDid: charlie.did,
    })
  })

  it('serializes concurrent commits from multiple tabs', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const firstTab = new WebSessionRepository()
    const secondTab = new WebSessionRepository()
    await firstTab.open(previous)
    await secondTab.open(previous)

    await Promise.all([
      firstTab.commit(previous, {
        accounts: [{...alice, emailConfirmed: true}, bob],
        currentDid: alice.did,
      }),
      secondTab.commit(previous, {
        accounts: [alice, {...bob, handle: 'new-bob.test'}],
        currentDid: alice.did,
      }),
    ])

    expect(readStoredSnapshot()).toEqual({
      accounts: [
        {...alice, emailConfirmed: true},
        {...bob, handle: 'new-bob.test'},
      ],
      currentDid: alice.did,
    })
    expect(storageLocks.request).toHaveBeenCalledWith(
      'bsky-session:BSKY_SESSION_STORAGE_V1',
      expect.any(Function),
    )
  })

  it('does not restore credentials revoked by another tab', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice],
      currentDid: alice.did,
    }
    const repository = new WebSessionRepository()
    await repository.open(previous)

    values.set(
      STORAGE_KEY,
      JSON.stringify({
        accounts: [{...alice, refreshJwt: undefined, accessJwt: undefined}],
        currentDid: undefined,
      }),
    )
    await repository.commit(previous, {
      accounts: [
        {...alice, refreshJwt: 'fresh-refresh', accessJwt: 'fresh-access'},
      ],
      currentDid: alice.did,
    })

    const {
      refreshJwt: _refreshJwt,
      accessJwt: _accessJwt,
      ...loggedOutAlice
    } = alice
    expect(readStoredSnapshot()).toEqual({
      accounts: [loggedOutAlice],
    })
  })

  it('preserves credential revocation during concurrent account adds', async () => {
    const repository = new WebSessionRepository()
    const previous: SessionSnapshot = {accounts: [], currentDid: undefined}
    await repository.open(previous)

    const {
      refreshJwt: _refreshJwt,
      accessJwt: _accessJwt,
      ...loggedOutAlice
    } = alice
    values.set(
      STORAGE_KEY,
      JSON.stringify({accounts: [loggedOutAlice], currentDid: undefined}),
    )

    await repository.commit(previous, {
      accounts: [alice],
      currentDid: alice.did,
    })
    expect(readStoredSnapshot()).toEqual({
      accounts: [loggedOutAlice],
      currentDid: alice.did,
    })
  })

  it('does not restore an account deleted by another tab', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const repository = new WebSessionRepository()
    await repository.open(previous)

    values.set(
      STORAGE_KEY,
      JSON.stringify({accounts: [bob], currentDid: bob.did}),
    )
    const editedAlice = {...alice, emailConfirmed: true}
    const next: SessionSnapshot = {
      accounts: [editedAlice, bob],
      currentDid: alice.did,
    }

    await expect(repository.commit(previous, next)).resolves.toEqual({
      status: 'committed',
    })
    expect(readStoredSnapshot()).toEqual({
      accounts: [bob],
      currentDid: bob.did,
    })
  })

  it('replaces an older pending commit with a failed clear', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice],
      currentDid: alice.did,
    }
    const repository = new WebSessionRepository()
    await repository.open(previous)

    failWrite = true
    await expect(
      repository.commit(previous, {
        accounts: [{...alice, accessJwt: 'new-access'}],
        currentDid: alice.did,
      }),
    ).resolves.toMatchObject({status: 'pending'})

    await expect(repository.clear()).rejects.toThrow(
      'session storage clear failed: write-failed',
    )
    expect(repository.getSnapshot()).toEqual({
      accounts: [],
      currentDid: undefined,
    })

    await expect(repository.commit(previous, previous)).resolves.toMatchObject({
      status: 'pending',
    })
    expect(repository.getSnapshot()).toEqual({
      accounts: [],
      currentDid: undefined,
    })

    failWrite = false
    await expect(repository.retryPending()).resolves.toEqual({
      status: 'committed',
    })
    expect(readStoredSnapshot()).toEqual({accounts: []})
    expect(repository.getSnapshot()).toEqual({accounts: []})
  })

  it('does not overwrite newer storage when initial persistence retries', async () => {
    failWrite = true
    const repository = new WebSessionRepository()
    const legacy = {accounts: [alice], currentDid: alice.did}
    const onLegacyMigrationComplete = jest.fn()
    await repository.open(legacy, onLegacyMigrationComplete)
    expect(onLegacyMigrationComplete).not.toHaveBeenCalled()

    const refreshed = {
      accounts: [{...alice, accessJwt: 'fresh-access'}],
      currentDid: alice.did,
    }
    failWrite = false
    values.set(STORAGE_KEY, JSON.stringify(refreshed))

    await expect(repository.retryPending()).resolves.toEqual({
      status: 'committed',
    })
    expect(readStoredSnapshot()).toEqual(refreshed)
    expect(repository.getSnapshot()).toEqual(refreshed)
    expect(onLegacyMigrationComplete).toHaveBeenCalledTimes(1)
  })
})

function readStoredSnapshot() {
  return JSON.parse(values.get(STORAGE_KEY)!)
}

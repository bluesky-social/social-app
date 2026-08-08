import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

import {WebSessionRepository} from '../repository.web'
import {type SessionAccount, type SessionSnapshot} from '../schema'

const STORAGE_KEY = 'BSKY_SESSION_STORAGE_V1'
const RETRY_DELAY = 5_000
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

const EMPTY: SessionSnapshot = {accounts: [], currentDid: undefined}

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
    const onDurable = jest.fn()

    await expect(
      repository.init({accounts: [alice], currentDid: alice.did}, onDurable),
    ).resolves.toEqual(EMPTY)
    await repository.whenSettled()
    expect(onDurable).toHaveBeenCalledTimes(1)
    expect(readStoredSnapshot()).toEqual(EMPTY)
  })

  it('keeps a legacy session in memory when localStorage is unavailable', async () => {
    failRead = true
    failWrite = true
    const repository = new WebSessionRepository()
    const legacy = {accounts: [alice], currentDid: alice.did}
    const onDurable = jest.fn()

    await expect(repository.init(legacy, onDurable)).resolves.toEqual(legacy)
    await repository.whenSettled()
    expect(onDurable).not.toHaveBeenCalled()
    expect(repository.getSnapshot()).toEqual(legacy)
  })

  it('rebases local changes onto a newer snapshot from another tab', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const repository = new WebSessionRepository()
    await repository.init(previous, jest.fn())

    const latest: SessionSnapshot = {
      accounts: [
        {...alice, refreshJwt: 'fresh-refresh', accessJwt: 'fresh-access'},
        bob,
        charlie,
      ],
      currentDid: charlie.did,
    }
    values.set(STORAGE_KEY, JSON.stringify(latest))

    repository.write({
      accounts: [{...alice, emailConfirmed: true}],
      currentDid: alice.did,
    })
    await repository.whenSettled()

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
    await firstTab.init(previous, jest.fn())
    await secondTab.init(previous, jest.fn())

    firstTab.write({
      accounts: [{...alice, emailConfirmed: true}, bob],
      currentDid: alice.did,
    })
    secondTab.write({
      accounts: [alice, {...bob, handle: 'new-bob.test'}],
      currentDid: alice.did,
    })
    await Promise.all([firstTab.whenSettled(), secondTab.whenSettled()])

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
    await repository.init(previous, jest.fn())

    values.set(
      STORAGE_KEY,
      JSON.stringify({
        accounts: [{...alice, refreshJwt: undefined, accessJwt: undefined}],
        currentDid: undefined,
      }),
    )
    repository.write({
      accounts: [
        {...alice, refreshJwt: 'fresh-refresh', accessJwt: 'fresh-access'},
      ],
      currentDid: alice.did,
    })
    await repository.whenSettled()

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
    await repository.init(EMPTY, jest.fn())

    const {
      refreshJwt: _refreshJwt,
      accessJwt: _accessJwt,
      ...loggedOutAlice
    } = alice
    values.set(
      STORAGE_KEY,
      JSON.stringify({accounts: [loggedOutAlice], currentDid: undefined}),
    )

    repository.write({
      accounts: [alice],
      currentDid: alice.did,
    })
    await repository.whenSettled()
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
    await repository.init(previous, jest.fn())

    values.set(
      STORAGE_KEY,
      JSON.stringify({accounts: [bob], currentDid: bob.did}),
    )
    repository.write({
      accounts: [{...alice, emailConfirmed: true}, bob],
      currentDid: alice.did,
    })
    await repository.whenSettled()

    expect(readStoredSnapshot()).toEqual({
      accounts: [bob],
      currentDid: bob.did,
    })
  })

  it('notifies subscribers when a merge changes the committed snapshot', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice],
      currentDid: alice.did,
    }
    const repository = new WebSessionRepository()
    await repository.init(previous, jest.fn())

    const committed: SessionSnapshot[] = []
    repository.subscribe(snapshot => committed.push(snapshot))

    // Another tab logged alice out; our unrelated edit must not resurrect her.
    values.set(
      STORAGE_KEY,
      JSON.stringify({
        accounts: [{...alice, refreshJwt: undefined, accessJwt: undefined}],
        currentDid: undefined,
      }),
    )
    repository.write({
      accounts: [{...alice, refreshJwt: 'fresh', accessJwt: 'fresh'}],
      currentDid: alice.did,
    })
    await repository.whenSettled()

    const {
      refreshJwt: _refreshJwt,
      accessJwt: _accessJwt,
      ...loggedOutAlice
    } = alice
    expect(committed).toEqual([{accounts: [loggedOutAlice]}])
  })

  it('drops writes after a failed clear until the clear succeeds', async () => {
    const previous: SessionSnapshot = {
      accounts: [alice],
      currentDid: alice.did,
    }
    const repository = new WebSessionRepository()
    await repository.init(previous, jest.fn())

    failWrite = true
    repository.write({
      accounts: [{...alice, accessJwt: 'new-access'}],
      currentDid: alice.did,
    })
    await repository.whenSettled()

    await expect(repository.clear()).rejects.toThrow(
      'session storage clear failed: write-failed',
    )
    expect(repository.getSnapshot()).toEqual(EMPTY)

    repository.write(previous)
    await repository.whenSettled()
    expect(repository.getSnapshot()).toEqual(EMPTY)

    failWrite = false
    jest.advanceTimersByTime(RETRY_DELAY)
    await repository.whenSettled()
    expect(readStoredSnapshot()).toEqual(EMPTY)
    expect(repository.getSnapshot()).toEqual(EMPTY)
  })

  it('does not overwrite newer storage when the initial persist retries', async () => {
    failWrite = true
    const repository = new WebSessionRepository()
    const legacy = {accounts: [alice], currentDid: alice.did}
    const onDurable = jest.fn()
    await repository.init(legacy, onDurable)
    await repository.whenSettled()
    expect(onDurable).not.toHaveBeenCalled()

    const refreshed = {
      accounts: [{...alice, accessJwt: 'fresh-access'}],
      currentDid: alice.did,
    }
    failWrite = false
    values.set(STORAGE_KEY, JSON.stringify(refreshed))

    jest.advanceTimersByTime(RETRY_DELAY)
    await repository.whenSettled()
    expect(readStoredSnapshot()).toEqual(refreshed)
    expect(repository.getSnapshot()).toEqual(refreshed)
    expect(onDurable).toHaveBeenCalledTimes(1)
  })
})

function readStoredSnapshot() {
  return JSON.parse(values.get(STORAGE_KEY)!)
}

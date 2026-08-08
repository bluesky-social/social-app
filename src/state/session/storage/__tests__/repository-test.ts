import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

import {accountKeys, SESSION_INDEX_KEY} from '../keys'
import {NativeSessionRepository} from '../repository'
import {type SessionAccount, type SessionSnapshot} from '../schema'
import {type SessionStorageError} from '../types'

const mockValues = new Map<string, string>()
let mockFailKey: string | undefined
const mockSetItem = jest.fn((key: string, value: string) => {
  if (key === mockFailKey) throw new Error('disk full')
  mockValues.set(key, value)
})
const mockGetItem = jest.fn((key: string) => mockValues.get(key) ?? null)
jest.mock('expo-secure-store', () => ({
  setItem: mockSetItem,
  getItem: mockGetItem,
}))

jest.mock('#/lib/appState', () => ({
  onAppStateChange: jest.fn(() => ({remove: jest.fn()})),
}))

const RETRY_DELAY = 5_000

const alice: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:alice',
  handle: 'alice.test',
  refreshJwt: 'alice-refresh',
  accessJwt: 'alice-access',
}

const EMPTY: SessionSnapshot = {accounts: [], currentDid: undefined}

beforeEach(() => {
  jest.useFakeTimers()
  mockValues.clear()
  mockFailKey = undefined
  mockSetItem.mockClear()
  mockGetItem.mockClear()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

/**
 * Register a failure collector on a repository. Failures surface through
 * onWriteFailure now that write() is fire-and-forget.
 */
function collectFailures(repository: NativeSessionRepository) {
  const failures: SessionStorageError[] = []
  repository.onWriteFailure(error => failures.push(error))
  return failures
}

describe('NativeSessionRepository', () => {
  it('migrates credentials synchronously and publishes the index last', async () => {
    const repository = new NativeSessionRepository()
    const onDurable = jest.fn()
    const legacy: SessionSnapshot = {
      accounts: [alice],
      currentDid: alice.did,
    }

    await expect(repository.init(legacy, onDurable)).resolves.toEqual(legacy)
    expect(onDurable).toHaveBeenCalledTimes(1)

    const keys = accountKeys(alice.did)
    expect(mockSetItem.mock.calls.map(([key]) => key)).toEqual([
      keys.refresh,
      keys.access,
      keys.descriptor,
      SESSION_INDEX_KEY,
    ])
    expect(keys.refresh).not.toContain(alice.did)
    expect(repository.getSnapshot()).toEqual(legacy)
  })

  it('uses an existing index as the migration marker', async () => {
    mockValues.set(
      SESSION_INDEX_KEY,
      JSON.stringify({version: 1, dids: [], currentDid: undefined}),
    )
    const repository = new NativeSessionRepository()
    const onDurable = jest.fn()

    await expect(
      repository.init({accounts: [alice], currentDid: alice.did}, onDurable),
    ).resolves.toEqual(EMPTY)
    expect(onDurable).toHaveBeenCalledTimes(1)
    expect(mockSetItem).not.toHaveBeenCalled()
  })

  it('repairs invalid data without resurrecting a legacy snapshot', async () => {
    mockValues.set(SESSION_INDEX_KEY, '{invalid json')
    const repository = new NativeSessionRepository()
    const onDurable = jest.fn()

    await expect(
      repository.init({accounts: [alice], currentDid: alice.did}, onDurable),
    ).resolves.toEqual(EMPTY)
    expect(onDurable).toHaveBeenCalledTimes(1)
  })

  it('rejects and stays re-callable when storage is unavailable', async () => {
    mockFailKey = SESSION_INDEX_KEY
    const repository = new NativeSessionRepository()

    await expect(repository.init(EMPTY, jest.fn())).rejects.toThrow(
      'session storage unavailable',
    )

    mockFailKey = undefined
    const onDurable = jest.fn()
    await expect(repository.init(EMPTY, onDurable)).resolves.toEqual(EMPTY)
    expect(onDurable).toHaveBeenCalledTimes(1)
  })

  it('keeps the newest snapshot in memory and retries a complete write', async () => {
    const repository = new NativeSessionRepository()
    const failures = collectFailures(repository)
    await repository.init(EMPTY, jest.fn())
    const keys = accountKeys(alice.did)
    mockFailKey = keys.access

    repository.write({accounts: [alice], currentDid: alice.did})
    expect(failures.length).toBe(1)

    const refreshed = {
      accounts: [
        {...alice, refreshJwt: 'new-refresh', accessJwt: 'new-access'},
      ],
      currentDid: alice.did,
    }
    repository.write(refreshed)
    expect(failures.length).toBe(2)
    expect(repository.getSnapshot()).toEqual(refreshed)

    mockFailKey = undefined
    jest.advanceTimersByTime(RETRY_DELAY)
    expect(mockValues.get(keys.refresh)).toBe('new-refresh')
    expect(mockValues.get(keys.access)).toBe('new-access')
    expect(JSON.parse(mockValues.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      currentDid: alice.did,
      dids: [alice.did],
    })
  })

  it('journals a retained-account logout against the previous index', async () => {
    const repository = new NativeSessionRepository()
    const active = {accounts: [alice], currentDid: alice.did}
    await repository.init(active, jest.fn())
    mockSetItem.mockClear()

    const loggedOut = {
      accounts: [{...alice, refreshJwt: undefined, accessJwt: undefined}],
      currentDid: undefined,
    }
    repository.write(loggedOut)

    const keys = accountKeys(alice.did)
    expect(mockSetItem.mock.calls).toEqual([
      [
        SESSION_INDEX_KEY,
        JSON.stringify({
          version: 1,
          currentDid: alice.did,
          dids: [alice.did],
          revokedDids: [alice.did],
        }),
      ],
      [keys.refresh, ''],
      [keys.access, ''],
      [
        SESSION_INDEX_KEY,
        JSON.stringify({version: 1, currentDid: undefined, dids: [alice.did]}),
      ],
    ])
  })

  it('finishes an interrupted retained-account logout on init', async () => {
    const keys = accountKeys(alice.did)
    const {
      accessJwt: _accessJwt,
      refreshJwt: _refreshJwt,
      ...descriptor
    } = alice
    mockValues.set(keys.refresh, '')
    mockValues.set(keys.access, alice.accessJwt!)
    mockValues.set(keys.descriptor, JSON.stringify(descriptor))
    mockValues.set(
      SESSION_INDEX_KEY,
      JSON.stringify({
        version: 1,
        dids: [alice.did],
        revokedDids: [alice.did],
      }),
    )

    const repository = new NativeSessionRepository()
    await expect(repository.init(EMPTY, jest.fn())).resolves.toMatchObject({
      accounts: [
        expect.objectContaining({
          did: alice.did,
          refreshJwt: undefined,
          accessJwt: undefined,
        }),
      ],
    })
    expect(mockValues.get(keys.access)).toBe('')
    expect(JSON.parse(mockValues.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      dids: [alice.did],
    })
  })

  it('tombstones a removed account without racing a later re-add', async () => {
    const repository = new NativeSessionRepository()
    const active = {accounts: [alice], currentDid: alice.did}
    await repository.init(active, jest.fn())
    mockSetItem.mockClear()

    repository.write(EMPTY)

    const keys = accountKeys(alice.did)
    expect(mockSetItem.mock.calls).toEqual([
      [
        SESSION_INDEX_KEY,
        JSON.stringify({
          version: 1,
          currentDid: undefined,
          dids: [],
          retiredDids: [alice.did],
        }),
      ],
      [keys.refresh, ''],
      [keys.access, ''],
      [keys.descriptor, ''],
      [
        SESSION_INDEX_KEY,
        JSON.stringify({version: 1, currentDid: undefined, dids: []}),
      ],
    ])

    repository.write(active)
    expect(mockValues.get(keys.refresh)).toBe(alice.refreshJwt)
    expect(mockValues.get(keys.access)).toBe(alice.accessJwt)
    expect(JSON.parse(mockValues.get(keys.descriptor)!)).toMatchObject({
      did: alice.did,
    })
  })

  it('finishes interrupted tombstoning before loading a session', async () => {
    const keys = accountKeys(alice.did)
    mockValues.set(keys.refresh, alice.refreshJwt!)
    mockValues.set(keys.access, alice.accessJwt!)
    mockValues.set(keys.descriptor, JSON.stringify(alice))
    mockValues.set(
      SESSION_INDEX_KEY,
      JSON.stringify({
        version: 1,
        dids: [],
        retiredDids: [alice.did],
      }),
    )

    const repository = new NativeSessionRepository()
    await expect(repository.init(EMPTY, jest.fn())).resolves.toEqual(EMPTY)

    expect(mockValues.get(keys.refresh)).toBe('')
    expect(mockValues.get(keys.access)).toBe('')
    expect(mockValues.get(keys.descriptor)).toBe('')
    expect(JSON.parse(mockValues.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      dids: [],
    })
  })

  it('clears accounts known only to the last durable snapshot', async () => {
    const repository = new NativeSessionRepository()
    const active = {accounts: [alice], currentDid: alice.did}
    await repository.init(active, jest.fn())

    mockFailKey = SESSION_INDEX_KEY
    repository.write(EMPTY)
    mockFailKey = undefined

    await repository.clear()

    const keys = accountKeys(alice.did)
    expect(mockValues.get(keys.refresh)).toBe('')
    expect(mockValues.get(keys.access)).toBe('')
    expect(mockValues.get(keys.descriptor)).toBe('')
    expect(JSON.parse(mockValues.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      dids: [],
    })
  })

  it('drops writes after a failed clear until the clear succeeds', async () => {
    const repository = new NativeSessionRepository()
    const active = {accounts: [alice], currentDid: alice.did}
    await repository.init(active, jest.fn())
    const keys = accountKeys(alice.did)

    mockFailKey = keys.access
    repository.write({
      accounts: [{...alice, accessJwt: 'new-access'}],
      currentDid: alice.did,
    })

    mockFailKey = SESSION_INDEX_KEY
    await expect(repository.clear()).rejects.toThrow('disk full')
    expect(repository.getSnapshot()).toEqual(EMPTY)

    repository.write(active)
    expect(repository.getSnapshot()).toEqual(EMPTY)

    mockFailKey = undefined
    jest.advanceTimersByTime(RETRY_DELAY)
    expect(mockValues.get(keys.refresh)).toBe('')
    expect(mockValues.get(keys.access)).toBe('')
    expect(mockValues.get(keys.descriptor)).toBe('')
    expect(JSON.parse(mockValues.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      dids: [],
    })
  })

  it('tombstones credentials from a superseded partial account write', async () => {
    const repository = new NativeSessionRepository()
    await repository.init(EMPTY, jest.fn())
    const keys = accountKeys(alice.did)

    mockFailKey = SESSION_INDEX_KEY
    repository.write({accounts: [alice], currentDid: alice.did})
    expect(mockValues.get(keys.refresh)).toBe(alice.refreshJwt)
    expect(mockValues.get(keys.access)).toBe(alice.accessJwt)

    mockFailKey = undefined
    repository.write(EMPTY)
    expect(mockValues.get(keys.refresh)).toBe('')
    expect(mockValues.get(keys.access)).toBe('')
    expect(mockValues.get(keys.descriptor)).toBe('')
  })
})

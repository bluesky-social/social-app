import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {accountKeys, SESSION_INDEX_KEY} from '../keys'
import {NativeSessionRepository} from '../repository'
import {type SessionAccount, type SessionSnapshot} from '../schema'

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

const alice: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:alice',
  handle: 'alice.test',
  refreshJwt: 'alice-refresh',
  accessJwt: 'alice-access',
}

beforeEach(() => {
  mockValues.clear()
  mockFailKey = undefined
  mockSetItem.mockClear()
  mockGetItem.mockClear()
  jest.clearAllTimers()
})

describe('NativeSessionRepository', () => {
  it('migrates credentials synchronously and publishes the index last', async () => {
    const repository = new NativeSessionRepository()
    const legacy: SessionSnapshot = {
      accounts: [alice],
      currentDid: alice.did,
    }

    await expect(repository.open(legacy)).resolves.toMatchObject({
      status: 'ready',
      shouldScrubLegacy: true,
    })

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

    await expect(
      repository.open({accounts: [alice], currentDid: alice.did}),
    ).resolves.toEqual({
      status: 'ready',
      snapshot: {accounts: [], currentDid: undefined},
      shouldScrubLegacy: true,
    })
    expect(mockSetItem).not.toHaveBeenCalled()
  })

  it('repairs invalid data without resurrecting a legacy snapshot', async () => {
    mockValues.set(SESSION_INDEX_KEY, '{invalid json')
    const repository = new NativeSessionRepository()

    await expect(
      repository.open({accounts: [alice], currentDid: alice.did}),
    ).resolves.toMatchObject({
      status: 'ready',
      snapshot: {accounts: [], currentDid: undefined},
      shouldScrubLegacy: true,
    })
  })

  it('keeps the newest snapshot in memory and retries a complete commit', async () => {
    const repository = new NativeSessionRepository()
    await repository.open()
    const keys = accountKeys(alice.did)
    mockFailKey = keys.access

    const first = {accounts: [alice], currentDid: alice.did}
    expect(repository.commit({accounts: []}, first).status).toBe('pending')

    const refreshed = {
      accounts: [
        {...alice, refreshJwt: 'new-refresh', accessJwt: 'new-access'},
      ],
      currentDid: alice.did,
    }
    expect(repository.commit(first, refreshed).status).toBe('pending')
    expect(repository.getSnapshot()).toEqual(refreshed)

    mockFailKey = undefined
    expect(repository.retryPending()).toEqual({status: 'committed'})
    expect(mockValues.get(keys.refresh)).toBe('new-refresh')
    expect(mockValues.get(keys.access)).toBe('new-access')
    expect(JSON.parse(mockValues.get(SESSION_INDEX_KEY)!)).toEqual({
      version: 1,
      currentDid: alice.did,
      dids: [alice.did],
    })
  })

  it('tombstones credentials before publishing logout', async () => {
    const repository = new NativeSessionRepository()
    const active = {accounts: [alice], currentDid: alice.did}
    await repository.open(active)
    mockSetItem.mockClear()

    const loggedOut = {
      accounts: [{...alice, refreshJwt: undefined, accessJwt: undefined}],
      currentDid: undefined,
    }
    expect(repository.commit(active, loggedOut)).toEqual({status: 'committed'})

    const keys = accountKeys(alice.did)
    expect(mockSetItem.mock.calls).toEqual([
      [
        SESSION_INDEX_KEY,
        JSON.stringify({
          version: 1,
          currentDid: undefined,
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

  it('finishes an interrupted retained-account logout on open', async () => {
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
    await expect(repository.open()).resolves.toMatchObject({
      status: 'ready',
      snapshot: {
        accounts: [
          expect.objectContaining({
            did: alice.did,
            refreshJwt: undefined,
            accessJwt: undefined,
          }),
        ],
      },
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
    await repository.open(active)
    mockSetItem.mockClear()

    const removed = {accounts: [], currentDid: undefined}
    expect(repository.commit(active, removed)).toEqual({status: 'committed'})

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

    expect(repository.commit(removed, active)).toEqual({status: 'committed'})
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
    await expect(repository.open()).resolves.toMatchObject({status: 'ready'})

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
    await repository.open(active)

    mockFailKey = SESSION_INDEX_KEY
    expect(
      repository.commit(active, {accounts: [], currentDid: undefined}).status,
    ).toBe('pending')
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

  it('cancels an older pending credential write when clear fails', async () => {
    const repository = new NativeSessionRepository()
    const active = {accounts: [alice], currentDid: alice.did}
    await repository.open(active)
    const keys = accountKeys(alice.did)

    mockFailKey = keys.access
    expect(
      repository.commit(active, {
        accounts: [{...alice, accessJwt: 'new-access'}],
        currentDid: alice.did,
      }).status,
    ).toBe('pending')

    mockFailKey = SESSION_INDEX_KEY
    await expect(repository.clear()).rejects.toThrow('disk full')
    expect(repository.getSnapshot()).toEqual({
      accounts: [],
      currentDid: undefined,
    })

    expect(repository.commit(active, active).status).toBe('pending')
    expect(repository.getSnapshot()).toEqual({
      accounts: [],
      currentDid: undefined,
    })

    mockFailKey = undefined
    expect(repository.retryPending()).toEqual({status: 'committed'})
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
    await repository.open()
    const keys = accountKeys(alice.did)

    mockFailKey = SESSION_INDEX_KEY
    expect(
      repository.commit(
        {accounts: []},
        {accounts: [alice], currentDid: alice.did},
      ).status,
    ).toBe('pending')
    expect(mockValues.get(keys.refresh)).toBe(alice.refreshJwt)
    expect(mockValues.get(keys.access)).toBe(alice.accessJwt)

    mockFailKey = undefined
    expect(
      repository.commit(
        {accounts: [alice], currentDid: alice.did},
        {accounts: [], currentDid: undefined},
      ),
    ).toEqual({status: 'committed'})
    expect(mockValues.get(keys.refresh)).toBe('')
    expect(mockValues.get(keys.access)).toBe('')
    expect(mockValues.get(keys.descriptor)).toBe('')
  })
})

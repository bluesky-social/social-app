import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>()
  const writes: [key: string, value: string][] = []
  const control: {failKey?: string} = {}
  return {
    AFTER_FIRST_UNLOCK: 0,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key === control.failKey) throw new Error('disk full')
      writes.push([key, value])
      values.set(key, value)
    },
    __mock: {values, writes, control},
  }
})

jest.mock('#/lib/appState', () => {
  const listeners: ((state: string) => void)[] = []
  return {
    onAppStateChange: (cb: (state: string) => void) => {
      listeners.push(cb)
      return {remove: () => {}}
    },
    __listeners: listeners,
  }
})

jest.mock('#/logger', () => {
  const errors: string[] = []
  const noop = () => {}
  const instance = {
    debug: noop,
    info: noop,
    log: noop,
    warn: noop,
    error: (message: string) => {
      errors.push(message)
    },
  }
  return {
    Logger: {Context: {Session: 'session'}, create: () => instance},
    logger: instance,
    __errors: errors,
  }
})

import {type SessionAccount} from '#/state/session/types'
import {accountKeys, SESSION_INDEX_KEY} from '../keys'
import {EMPTY_SNAPSHOT, type SessionSnapshot} from '../schema'
import {createSessionStorageStore} from '../store'

const {__mock: secure} = jest.requireMock('expo-secure-store') as {
  __mock: {
    values: Map<string, string>
    writes: [key: string, value: string][]
    control: {failKey?: string}
  }
}
const {__listeners: appStateListeners} = jest.requireMock('#/lib/appState') as {
  __listeners: ((state: string) => void)[]
}
const {__errors: loggedErrors} = jest.requireMock('#/logger') as {
  __errors: string[]
}

const RETRY_DELAY = 5_000

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
  jest.useFakeTimers()
  secure.values.clear()
  secure.writes.length = 0
  secure.control.failKey = undefined
  appStateListeners.length = 0
  loggedErrors.length = 0
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

function storedIndex() {
  return JSON.parse(secure.values.get(SESSION_INDEX_KEY)!)
}

describe('createSessionStorageStore', () => {
  it('holds no retry trigger while writes succeed', () => {
    const store = createSessionStorageStore()

    store.write(active)

    expect(store.getDurable()).toEqual(active)
    expect(appStateListeners.length).toBe(0)
    expect(loggedErrors).toEqual([])
  })

  it('retries the newest snapshot as one complete write', () => {
    const store = createSessionStorageStore()
    secure.control.failKey = aliceKeys.access

    store.write(active)
    const refreshed: SessionSnapshot = {
      accounts: [
        {...alice, refreshJwt: 'new-refresh', accessJwt: 'new-access'},
      ],
      currentDid: alice.did,
    }
    store.write(refreshed)
    expect(loggedErrors.length).toBe(2)
    expect(store.getDurable()).toEqual(EMPTY_SNAPSHOT)

    secure.control.failKey = undefined
    jest.advanceTimersByTime(RETRY_DELAY)

    expect(secure.values.get(aliceKeys.refresh)).toBe('new-refresh')
    expect(secure.values.get(aliceKeys.access)).toBe('new-access')
    expect(storedIndex()).toEqual({
      version: 1,
      currentDid: alice.did,
      dids: [alice.did],
    })
    expect(store.getDurable()).toEqual(refreshed)
  })

  it('tombstones credentials from a superseded partial write', () => {
    const store = createSessionStorageStore()
    secure.control.failKey = SESSION_INDEX_KEY

    store.write(active)
    expect(secure.values.get(aliceKeys.refresh)).toBe(alice.refreshJwt)

    secure.control.failKey = undefined
    store.write(EMPTY_SNAPSHOT)

    expect(secure.values.get(aliceKeys.refresh)).toBe('')
    expect(secure.values.get(aliceKeys.access)).toBe('')
    expect(secure.values.get(aliceKeys.descriptor)).toBe('')
  })

  it('clears accounts known only to the last durable snapshot', () => {
    const store = createSessionStorageStore()
    store.write(active)

    secure.control.failKey = SESSION_INDEX_KEY
    store.write(EMPTY_SNAPSHOT)
    secure.control.failKey = undefined

    store.clear()

    expect(secure.values.get(aliceKeys.refresh)).toBe('')
    expect(secure.values.get(aliceKeys.access)).toBe('')
    expect(secure.values.get(aliceKeys.descriptor)).toBe('')
    expect(storedIndex()).toEqual({version: 1, dids: []})
    expect(store.getDurable()).toEqual(EMPTY_SNAPSHOT)
  })

  it('drops writes until a failed clear succeeds', () => {
    const store = createSessionStorageStore()
    store.write(active)

    secure.control.failKey = aliceKeys.access
    store.write({
      accounts: [{...alice, accessJwt: 'new-access'}],
      currentDid: alice.did,
    })

    secure.control.failKey = SESSION_INDEX_KEY
    expect(() => store.clear()).not.toThrow()

    const writesBeforeDroppedWrite = secure.writes.length
    store.write(active)
    expect(secure.writes.length).toBe(writesBeforeDroppedWrite)

    secure.control.failKey = undefined
    jest.advanceTimersByTime(RETRY_DELAY)

    expect(secure.values.get(aliceKeys.refresh)).toBe('')
    expect(secure.values.get(aliceKeys.access)).toBe('')
    expect(secure.values.get(aliceKeys.descriptor)).toBe('')
    expect(storedIndex()).toEqual({version: 1, dids: []})
  })

  it('retries when the app returns to the foreground', () => {
    const store = createSessionStorageStore()
    secure.control.failKey = aliceKeys.access
    store.write(active)
    expect(appStateListeners.length).toBe(1)

    secure.control.failKey = undefined
    appStateListeners.forEach(listener => listener('active'))

    expect(secure.values.get(aliceKeys.access)).toBe(alice.accessJwt)
    expect(storedIndex()).toEqual({
      version: 1,
      currentDid: alice.did,
      dids: [alice.did],
    })
    expect(store.getDurable()).toEqual(active)
  })
})

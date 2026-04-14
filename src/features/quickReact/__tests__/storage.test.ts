import {beforeEach, describe, expect, jest, test} from '@jest/globals'

jest.mock('@bsky.app/react-native-mmkv', () => ({
  MMKV: class MMKVMock {
    _store = new Map<string, string>()
    _listeners: ((key: string) => void)[] = []

    set(key: string, value: string) {
      this._store.set(key, value)
      this._listeners.forEach(l => l(key))
    }

    getString(key: string) {
      return this._store.get(key)
    }

    delete(key: string) {
      this._store.delete(key)
      this._listeners.forEach(l => l(key))
    }

    clearAll() {
      this._store.clear()
    }

    addOnValueChangedListener(l: (key: string) => void) {
      this._listeners.push(l)
      return {
        remove: () => {
          this._listeners = this._listeners.filter(x => x !== l)
        },
      }
    }
  },
}))

import {MAX_RECORDS, PRUNE_COUNT} from '#/features/quickReact/constants'
import {
  deleteAccountReaction,
  readAccountReactions,
  subscribeToReactions,
  writeAccountReaction,
} from '#/features/quickReact/storage'
import {account} from '#/storage'

const DID_A = 'did:plc:alice'
const DID_B = 'did:plc:bob'

beforeEach(() => {
  account.removeAll()
})

describe('quickReact storage', () => {
  test('read/write round-trip per DID', () => {
    writeAccountReaction(DID_A, 'at://a/1', 'heart', 100)
    const map = readAccountReactions(DID_A)
    expect(map['at://a/1']).toEqual({
      postUri: 'at://a/1',
      emoji: 'heart',
      updatedAt: 100,
    })
  })

  test('cross-DID isolation', () => {
    writeAccountReaction(DID_A, 'at://shared', 'heart', 100)
    expect(readAccountReactions(DID_B)).toEqual({})
    writeAccountReaction(DID_B, 'at://shared', 'fire', 200)
    expect(readAccountReactions(DID_A)['at://shared'].emoji).toBe('heart')
    expect(readAccountReactions(DID_B)['at://shared'].emoji).toBe('fire')
  })

  test('delete removes record', () => {
    writeAccountReaction(DID_A, 'at://a/1', 'heart', 100)
    deleteAccountReaction(DID_A, 'at://a/1')
    expect(readAccountReactions(DID_A)['at://a/1']).toBeUndefined()
  })

  test('500-record cap triggers oldest-100 eviction by updatedAt', () => {
    for (let i = 0; i < MAX_RECORDS + 1; i++) {
      writeAccountReaction(DID_A, `at://a/${i}`, 'heart', 1000 + i)
    }
    const map = readAccountReactions(DID_A)
    const keyCount = Object.keys(map).length
    expect(keyCount).toBe(MAX_RECORDS + 1 - PRUNE_COUNT)
    // oldest entries evicted
    expect(map['at://a/0']).toBeUndefined()
    expect(map[`at://a/${MAX_RECORDS}`]).toBeDefined()
  })

  test('version field preservation across writes', () => {
    writeAccountReaction(DID_A, 'at://a/1', 'heart', 100)
    writeAccountReaction(DID_A, 'at://a/2', 'fire', 200)
    const raw = account.get([DID_A, 'quickReactions'])
    expect(raw?.version).toBe(1)
  })

  test('corrupt/missing record returns empty map', () => {
    // never written
    expect(readAccountReactions(DID_A)).toEqual({})
    // corrupt via direct set
    account.set([DID_A, 'quickReactions'], {version: 999} as unknown as any)
    expect(readAccountReactions(DID_A)).toEqual({})
  })

  test('subscribeToReactions fires on write', () => {
    const cb = jest.fn()
    const unsub = subscribeToReactions(DID_A, cb)
    writeAccountReaction(DID_A, 'at://a/1', 'heart', 100)
    expect(cb).toHaveBeenCalled()
    unsub()
  })
})

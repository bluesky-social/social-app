import {beforeEach, describe, expect, jest, test} from '@jest/globals'

jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: {did: 'did:plc:alice'},
    hasSession: true,
  }),
}))

jest.mock('@bsky.app/react-native-mmkv', () => ({
  MMKV: class MMKVMock {
    _store = new Map<string, string>()
    set(key: string, v: string) {
      this._store.set(key, v)
    }
    getString(key: string) {
      return this._store.get(key)
    }
    delete(key: string) {
      this._store.delete(key)
    }
    clearAll() {
      this._store.clear()
    }
    addOnValueChangedListener() {
      return {remove: () => {}}
    }
  },
}))

import {QueryClient} from '@tanstack/react-query'

import {
  applyOptimisticWrite,
  createViewerReactionsQueryKey,
  revertOptimisticWrite,
} from '#/features/quickReact/queries/reactions'
import {readAccountReactions} from '#/features/quickReact/storage'
import {account} from '#/storage'

const DID = 'did:plc:alice'

function makeClient() {
  return new QueryClient({defaultOptions: {queries: {retry: false}}})
}

beforeEach(() => {
  account.removeAll()
})

describe('quickReact queries', () => {
  test('optimistic setQueryData reflects new emoji synchronously', () => {
    const qc = makeClient()
    applyOptimisticWrite(DID, 'at://a/1', 'heart', qc)
    const data: any = qc.getQueryData(createViewerReactionsQueryKey({did: DID}))
    expect(data['at://a/1'].emoji).toBe('heart')
  })

  test('failed mutation reverts cache to pre-change snapshot', () => {
    const qc = makeClient()
    applyOptimisticWrite(DID, 'at://a/1', 'heart', qc)
    const previous = applyOptimisticWrite(DID, 'at://a/1', 'fire', qc)
    // simulate failure: revert using previous
    revertOptimisticWrite(DID, 'at://a/1', previous, qc)
    const map = readAccountReactions(DID)
    expect(map['at://a/1'].emoji).toBe('heart')
  })

  test('remove path deletes record (null write)', () => {
    const qc = makeClient()
    applyOptimisticWrite(DID, 'at://a/1', 'heart', qc)
    applyOptimisticWrite(DID, 'at://a/1', null, qc)
    const map = readAccountReactions(DID)
    expect(map['at://a/1']).toBeUndefined()
  })

  test('one reaction per (viewer DID, postUri) invariant', () => {
    const qc = makeClient()
    applyOptimisticWrite(DID, 'at://a/1', 'heart', qc)
    applyOptimisticWrite(DID, 'at://a/1', 'fire', qc)
    const map = readAccountReactions(DID)
    expect(map['at://a/1'].emoji).toBe('fire')
    expect(Object.keys(map)).toHaveLength(1)
  })

  test('change emoji replaces prior', () => {
    const qc = makeClient()
    applyOptimisticWrite(DID, 'at://a/1', 'heart', qc)
    applyOptimisticWrite(DID, 'at://a/1', 'eyes', qc)
    expect(readAccountReactions(DID)['at://a/1'].emoji).toBe('eyes')
  })

  test('query returns undefined emoji when no record', () => {
    const qc = makeClient()
    const data = qc.getQueryData(createViewerReactionsQueryKey({did: DID}))
    expect(data).toBeUndefined()
  })
})

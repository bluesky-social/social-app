/*
 * Unit tests for the quick-react debounce scheduler. We exercise the core
 * apply/revert helpers and a minimal scheduler harness so timer-based
 * behaviour can be verified without a full React tree.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'

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

import {DEBOUNCE_MS} from '#/features/quickReact/constants'
import {
  applyOptimisticWrite,
  createViewerReactionsQueryKey,
  revertOptimisticWrite,
} from '#/features/quickReact/queries/reactions'
import {readAccountReactions} from '#/features/quickReact/storage'
import {type ReactionEmoji} from '#/features/quickReact/types'
import {account} from '#/storage'

const DID = 'did:plc:alice'

type Entry = {
  timer: ReturnType<typeof setTimeout> | null
  lastKnown: ReturnType<typeof readAccountReactions>[string] | undefined
  lastKnownCaptured: boolean
  pendingEmoji: ReactionEmoji | null
}

function makeScheduler(
  qc: QueryClient,
  mutate: (postUri: string, emoji: ReactionEmoji | null) => Promise<void>,
) {
  const pending = new Map<string, Entry>()
  const flushOne = async (postUri: string) => {
    const p = pending.get(postUri)
    if (!p) return
    if (p.timer) clearTimeout(p.timer)
    pending.delete(postUri)
    try {
      await mutate(postUri, p.pendingEmoji)
    } catch {
      revertOptimisticWrite(DID, postUri, p.lastKnown, qc)
    }
  }
  const schedule = (postUri: string, emoji: ReactionEmoji | null) => {
    const before = applyOptimisticWrite(DID, postUri, emoji, qc)
    const existing = pending.get(postUri)
    if (existing?.timer) clearTimeout(existing.timer)
    const e: Entry = existing ?? {
      timer: null,
      lastKnown: undefined,
      lastKnownCaptured: false,
      pendingEmoji: emoji,
    }
    if (!e.lastKnownCaptured) {
      e.lastKnown = before
      e.lastKnownCaptured = true
    }
    e.pendingEmoji = emoji
    e.timer = setTimeout(() => void flushOne(postUri), DEBOUNCE_MS)
    pending.set(postUri, e)
  }
  const cancel = (postUri: string) => {
    const e = pending.get(postUri)
    if (!e) return
    if (e.timer) clearTimeout(e.timer)
    pending.delete(postUri)
  }
  const flushAll = async () => {
    const uris = Array.from(pending.keys())
    for (const uri of uris) await flushOne(uri)
  }
  return {schedule, cancel, flushAll, pending}
}

beforeEach(() => {
  jest.useFakeTimers()
  account.removeAll()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('quickReact debounce scheduler', () => {
  test('single selection fires one mutation after 2s', () => {
    const qc = new QueryClient()
    const mutate = jest.fn(async () => {})
    const s = makeScheduler(qc, mutate as any)
    s.schedule('at://a/1', 'heart')
    jest.advanceTimersByTime(DEBOUNCE_MS - 1)
    expect(mutate).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith('at://a/1', 'heart')
  })

  test('three selections within 2s fire one mutation with final emoji', () => {
    const qc = new QueryClient()
    const mutate = jest.fn(async () => {})
    const s = makeScheduler(qc, mutate as any)
    s.schedule('at://a/1', 'heart')
    jest.advanceTimersByTime(500)
    s.schedule('at://a/1', 'fire')
    jest.advanceTimersByTime(500)
    s.schedule('at://a/1', 'eyes')
    jest.advanceTimersByTime(DEBOUNCE_MS)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith('at://a/1', 'eyes')
  })

  test('selections on different postUris have independent timers', () => {
    const qc = new QueryClient()
    const mutate = jest.fn(async () => {})
    const s = makeScheduler(qc, mutate as any)
    s.schedule('at://a/1', 'heart')
    jest.advanceTimersByTime(500)
    s.schedule('at://a/2', 'fire')
    jest.advanceTimersByTime(DEBOUNCE_MS - 500)
    expect(mutate).toHaveBeenCalledWith('at://a/1', 'heart')
    jest.advanceTimersByTime(500)
    expect(mutate).toHaveBeenCalledWith('at://a/2', 'fire')
    expect(mutate).toHaveBeenCalledTimes(2)
  })

  test('failure reverts MMKV + cache to lastKnown', async () => {
    const qc = new QueryClient()
    const s = makeScheduler(qc, async () => {
      throw new Error('network')
    })
    // seed prior state: heart
    applyOptimisticWrite(DID, 'at://a/1', 'heart', qc)
    // user changes to fire via scheduler
    s.schedule('at://a/1', 'fire')
    expect(readAccountReactions(DID)['at://a/1'].emoji).toBe('fire')
    jest.advanceTimersByTime(DEBOUNCE_MS)
    await Promise.resolve()
    await Promise.resolve()
    expect(readAccountReactions(DID)['at://a/1'].emoji).toBe('heart')
  })

  test('cancel(postUri) stops flush', () => {
    const qc = new QueryClient()
    const mutate = jest.fn(async () => {})
    const s = makeScheduler(qc, mutate as any)
    s.schedule('at://a/1', 'heart')
    s.cancel('at://a/1')
    jest.advanceTimersByTime(DEBOUNCE_MS + 100)
    expect(mutate).not.toHaveBeenCalled()
  })

  test('flushAll flushes pending timers immediately', async () => {
    const qc = new QueryClient()
    const mutate = jest.fn(async () => {})
    const s = makeScheduler(qc, mutate as any)
    s.schedule('at://a/1', 'heart')
    s.schedule('at://a/2', 'fire')
    await s.flushAll()
    expect(mutate).toHaveBeenCalledTimes(2)
  })

  test('optimistic update visible within one React tick', () => {
    const qc = new QueryClient()
    const mutate = jest.fn(async () => {})
    const s = makeScheduler(qc, mutate as any)
    s.schedule('at://a/1', 'heart')
    const data = qc.getQueryData(createViewerReactionsQueryKey({did: DID}))
    expect(data['at://a/1'].emoji).toBe('heart')
  })
})

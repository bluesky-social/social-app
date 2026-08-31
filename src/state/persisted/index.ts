import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {
  defaults,
  type Schema,
  tryParse,
  tryStringify,
} from '#/state/persisted/schema'
import {device} from '#/storage'
import {
  applySessionUpdate,
  type SessionCredentialMutation,
} from './session-merge'
import {type PersistedApi} from './types'
import {normalizeData} from './util'

export type {PersistedAccount, Schema} from '#/state/persisted/schema'
export {defaults} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'

let _state: Schema = defaults
/**
 * AsyncStorage persists the entire root state as one asynchronous write. This
 * queue ensures each mutation computes from `_state` after the previous write
 * commits instead of racing another whole-root snapshot.
 */
let enqueuedWrite: Promise<unknown> = Promise.resolve()

export async function init() {
  const stored = await readFromStorage()
  if (stored) {
    _state = stored
  }
}
init satisfies PersistedApi['init']

export function get<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key]
}
get satisfies PersistedApi['get']

/**
 * Native is single-instance: there is no other tab that could have written
 * newer data behind our back, so the in-memory `_state` is already the truth
 * and a synchronous fresh read is impossible anyway (AsyncStorage is async).
 * This mirrors {@link get}; the web implementation is the one that actually
 * re-reads the store.
 */
export function readLatest<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key]
}
readLatest satisfies PersistedApi['readLatest']

export function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
): Promise<void> {
  if (key === 'session') {
    throw new Error(
      "Session state must be written through '#/state/persisted/session'",
    )
  }
  return enqueueWrite(async () => {
    const next = normalizeData({
      ..._state,
      [key]: value,
    })
    await persistWithRetry(next)
    _state = next
  })
}
write satisfies PersistedApi['write']

/** @internal Use `#/state/persisted/session` instead. */
export function writeSessionInternal({
  nextSession,
  credentialMutations,
}: {
  nextSession: Schema['session']
  credentialMutations: SessionCredentialMutation[]
}): Promise<Schema['session']> {
  return enqueueWrite(async () => {
    const session = applySessionUpdate({
      storedSession: _state.session,
      nextSession,
      credentialMutations,
    })
    const next = normalizeData({..._state, session})
    await persistWithRetry(next)
    _state = next
    return session
  })
}
export function onUpdate<K extends keyof Schema>(
  _key: K,
  _cb: (v: Schema[K]) => void,
): () => void {
  return () => {}
}
onUpdate satisfies PersistedApi['onUpdate']

export async function clearStorage() {
  try {
    await AsyncStorage.removeItem(BSKY_STORAGE)
    device.removeAll()
  } catch (e: any) {
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
  }
}
clearStorage satisfies PersistedApi['clearStorage']

/**
 * Queues native root-state mutations while preserving their results for the
 * caller. The queued operations run after the previous writes settle even when
 * those writes failed.
 */
function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = enqueuedWrite.then(operation)
  enqueuedWrite = (async () => {
    try {
      await result
    } catch {
      // The caller receives `result`; only the queue tail ignores its rejection.
    }
  })()
  return result
}

async function persistWithRetry(value: Schema) {
  try {
    await writeToStorage(value)
  } catch {
    /* Retry the latest complete snapshot while the process still owns it. */
    await writeToStorage(value)
  }
}

async function writeToStorage(value: Schema) {
  const rawData = tryStringify(value)
  if (!rawData) return
  try {
    await AsyncStorage.setItem(BSKY_STORAGE, rawData)
  } catch (e) {
    logger.error(`persisted state: failed writing root state to storage`, {
      message: e,
    })
    throw e
  }
}

async function readFromStorage(): Promise<Schema | undefined> {
  let rawData: string | null = null
  try {
    rawData = await AsyncStorage.getItem(BSKY_STORAGE)
  } catch (e) {
    logger.error(`persisted state: failed reading root state from storage`, {
      message: e,
    })
  }
  if (rawData) {
    const parsed = tryParse(rawData)
    if (parsed) {
      return normalizeData(parsed)
    }
  }
}

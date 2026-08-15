import {onAppStateChange} from '#/lib/appState'
import {
  logStorageError,
  type SessionStorageErrorOperation,
  storageError,
} from './errors'
import {EMPTY_SNAPSHOT, type SessionSnapshot} from './schema'
import {eraseSessions, writeSessions} from './secureStore'

const RETRY_DELAY = 5_000

/**
 * Pending work is a union so the sticky-clear rule reads as one guard: while a
 * clear is pending, a write is dropped rather than risk resurrecting a session
 * after a requested wipe.
 */
type PendingWork =
  {type: 'write'; snapshot: SessionSnapshot} | {type: 'clear'; dids: string[]}

export type SessionStorageStore = {
  /** The snapshot last known to be durably stored. */
  getDurable(): SessionSnapshot
  /**
   * Adopt `snapshot` as the durable baseline, discarding any pending work.
   * Called once at boot with whatever the store was found to hold.
   */
  setDurable(snapshot: SessionSnapshot): void
  /**
   * Mirror a snapshot into storage. Fire-and-forget: a failure is logged and
   * retried, and the newest snapshot wins.
   */
  write(next: SessionSnapshot): void
  /** Erase everything, including leftovers from interrupted writes. */
  clear(): void
}

/**
 * The in-memory write lifecycle: the last durable snapshot, the pending work,
 * the maybe-orphaned did set, and the retry timer. All storage layout and
 * crash recovery live in `secureStore.ts`.
 *
 * This store is a mirror, not a source of truth - the session reducer owns
 * in-memory session state - so nothing here throws and nothing here is awaited.
 */
export function createSessionStorageStore(): SessionStorageStore {
  let durableSnapshot: SessionSnapshot = EMPTY_SNAPSHOT
  let pending: PendingWork | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryTriggersAttached = false
  const maybeOrphanedDids = new Set<string>()

  function getDurable() {
    return durableSnapshot
  }

  function setDurable(snapshot: SessionSnapshot) {
    durableSnapshot = snapshot
    maybeOrphanedDids.clear()
    pending = undefined
    cancelRetry()
  }

  function write(next: SessionSnapshot) {
    if (pending?.type === 'clear') return
    persist(next, 'write')
  }

  function clear() {
    const dids = [
      ...new Set([
        ...durableSnapshot.accounts.map(account => account.did),
        ...(pending?.type === 'write'
          ? pending.snapshot.accounts.map(account => account.did)
          : []),
        ...maybeOrphanedDids,
      ]),
    ]
    pending = {type: 'clear', dids}
    cancelRetry()
    try {
      eraseSessions(dids)
      durableSnapshot = EMPTY_SNAPSHOT
      maybeOrphanedDids.clear()
      pending = undefined
    } catch (cause) {
      logStorageError(storageError('clear', cause))
      scheduleRetry()
    }
  }

  function persist(
    next: SessionSnapshot,
    operation: SessionStorageErrorOperation,
  ) {
    trackMaybeOrphaned(next)
    try {
      writeSessions(durableSnapshot, next, {
        alsoRetire: [...maybeOrphanedDids],
      })
      durableSnapshot = next
      maybeOrphanedDids.clear()
      pending = undefined
      cancelRetry()
    } catch (cause) {
      pending = {type: 'write', snapshot: next}
      logStorageError(storageError(operation, cause))
      scheduleRetry()
    }
  }

  function retry() {
    if (!pending) return
    if (pending.type === 'write') {
      persist(pending.snapshot, 'retry')
      return
    }
    const {dids} = pending
    try {
      eraseSessions(dids)
      durableSnapshot = EMPTY_SNAPSHOT
      maybeOrphanedDids.clear()
      pending = undefined
      cancelRetry()
    } catch (cause) {
      logStorageError(storageError('retry', cause))
      scheduleRetry()
    }
  }

  /**
   * Remember dids we may have partially written under a did the durable index
   * never named, so a later retire or clear still tombstones their keys even
   * if the failing commit never reached its index.
   */
  function trackMaybeOrphaned(next: SessionSnapshot) {
    const durableDids = new Set(
      durableSnapshot.accounts.map(account => account.did),
    )
    for (const account of next.accounts) {
      if (!durableDids.has(account.did)) {
        maybeOrphanedDids.add(account.did)
      }
    }
  }

  /**
   * Attached on the first failure rather than up front, so a store that never
   * fails never holds a listener.
   */
  function attachRetryTriggers() {
    if (retryTriggersAttached) return
    retryTriggersAttached = true
    onAppStateChange(state => {
      if (state === 'active' && pending) retry()
    })
  }

  function scheduleRetry() {
    attachRetryTriggers()
    if (retryTimer) return
    retryTimer = setTimeout(() => {
      retryTimer = undefined
      retry()
    }, RETRY_DELAY)
  }

  function cancelRetry() {
    if (retryTimer) clearTimeout(retryTimer)
    retryTimer = undefined
  }

  return {getDurable, setDurable, write, clear}
}

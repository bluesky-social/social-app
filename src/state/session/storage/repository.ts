import {onAppStateChange} from '#/lib/appState'
import {
  InvalidSessionStorageDataError,
  logStorageError,
  storageError,
} from './errors'
import {type SessionSnapshot} from './schema'
import {
  eraseSessions,
  indexExists,
  readSessions,
  writeSessions,
} from './secureStore'
import {type SessionRepository, type SessionStorageError} from './types'

const EMPTY_SNAPSHOT: SessionSnapshot = {accounts: [], currentDid: undefined}
const RETRY_DELAY = 5_000

/**
 * Native session repository. Owns only the in-memory lifecycle - the current
 * snapshot, the last durable snapshot, the pending work, the maybe-orphaned
 * did set, and the retry timer. All keychain layout and crash recovery live in
 * secureStore.ts.
 *
 * Pending work is a union so the sticky-clear rule reads as one guard: while a
 * clear is pending, write() drops its input rather than risk resurrecting a
 * session after a requested wipe.
 */
type PendingWork =
  | {type: 'write'; snapshot: SessionSnapshot}
  | {type: 'clear'; dids: string[]}

export class NativeSessionRepository implements SessionRepository {
  private snapshot: SessionSnapshot = EMPTY_SNAPSHOT
  private durableSnapshot: SessionSnapshot = EMPTY_SNAPSHOT
  private pending: PendingWork | undefined
  private maybeOrphanedDids = new Set<string>()
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private subscribers = new Set<(snapshot: SessionSnapshot) => void>()
  private writeFailureListeners = new Set<
    (error: SessionStorageError) => void
  >()
  private retryTriggersAttached = false

  // async to keep one repository contract across native and web.
  // eslint-disable-next-line @typescript-eslint/require-await
  async init(
    legacy: SessionSnapshot,
    onDurable: () => void,
  ): Promise<SessionSnapshot> {
    try {
      if (indexExists()) {
        try {
          this.setDurable(readSessions())
        } catch (cause) {
          if (!(cause instanceof InvalidSessionStorageDataError)) throw cause
          logStorageError({kind: 'invalid-data', operation: 'init'})
          // The index proves migration previously reached its commit point.
          // Repair to a clean empty state rather than resurrect possibly stale
          // credentials from the legacy blob.
          this.setDurable(this.migrate(EMPTY_SNAPSHOT))
        }
      } else {
        this.setDurable(this.migrate(legacy))
      }
    } catch (cause) {
      const error = storageError('init', cause)
      logStorageError(error)
      throw new Error(`session storage unavailable: ${error.kind}`)
    }

    // Attach retry triggers only after a successful init, so a failed init
    // that the app-level bootstrap retries never leaves a live listener.
    this.attachRetryTriggers()
    // The store is durable now: either an index already existed or the
    // migration was written and read back successfully.
    onDurable()
    return this.snapshot
  }

  getSnapshot(): SessionSnapshot {
    return this.snapshot
  }

  write(next: SessionSnapshot): void {
    if (this.pending?.type === 'clear') {
      // A requested wipe is still settling. Drop writes so we never resurrect
      // a session after clear(); the pending clear stays authoritative.
      this.snapshot = EMPTY_SNAPSHOT
      return
    }
    this.snapshot = next
    this.persist(next, 'write')
  }

  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void {
    this.subscribers.add(listener)
    return () => {
      this.subscribers.delete(listener)
    }
  }

  onWriteFailure(listener: (error: SessionStorageError) => void): () => void {
    this.writeFailureListeners.add(listener)
    return () => {
      this.writeFailureListeners.delete(listener)
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async clear(): Promise<void> {
    const dids = [
      ...new Set([
        ...this.durableSnapshot.accounts.map(account => account.did),
        ...this.snapshot.accounts.map(account => account.did),
        ...this.maybeOrphanedDids,
      ]),
    ]
    this.snapshot = EMPTY_SNAPSHOT
    this.pending = {type: 'clear', dids}
    this.cancelRetry()
    try {
      eraseSessions(dids)
      this.durableSnapshot = EMPTY_SNAPSHOT
      this.maybeOrphanedDids.clear()
      this.pending = undefined
    } catch (cause) {
      const error = storageError('clear', cause)
      logStorageError(error)
      this.emitFailure(error)
      this.scheduleRetry()
      throw cause
    }
  }

  /**
   * Write the legacy snapshot to the new store and read it back so migration
   * is only considered durable once every item validates. `forceIndex`
   * guarantees the first-ever write publishes an index even when empty.
   */
  private migrate(legacy: SessionSnapshot): SessionSnapshot {
    writeSessions(EMPTY_SNAPSHOT, legacy, {forceIndex: true})
    return readSessions()
  }

  private persist(
    next: SessionSnapshot,
    operation: SessionStorageError['operation'],
  ) {
    this.trackMaybeOrphaned(next)
    try {
      writeSessions(this.durableSnapshot, next, {
        alsoRetire: [...this.maybeOrphanedDids],
      })
      this.durableSnapshot = next
      this.maybeOrphanedDids.clear()
      this.pending = undefined
      this.cancelRetry()
    } catch (cause) {
      this.pending = {type: 'write', snapshot: next}
      const error = storageError(operation, cause)
      logStorageError(error)
      this.emitFailure(error)
      this.scheduleRetry()
    }
  }

  private retry() {
    if (!this.pending) return
    if (this.pending.type === 'clear') {
      const {dids} = this.pending
      try {
        eraseSessions(dids)
        this.durableSnapshot = EMPTY_SNAPSHOT
        this.snapshot = EMPTY_SNAPSHOT
        this.maybeOrphanedDids.clear()
        this.pending = undefined
        this.cancelRetry()
      } catch (cause) {
        const error = storageError('retry', cause)
        logStorageError(error)
        this.emitFailure(error)
        this.scheduleRetry()
      }
    } else {
      this.persist(this.pending.snapshot, 'retry')
    }
  }

  /**
   * Remember dids we may have partially written under a did the durable index
   * never named, so a later retire or clear still tombstones their keys even
   * if the failing commit never reached its index.
   */
  private trackMaybeOrphaned(next: SessionSnapshot) {
    const durableDids = new Set(
      this.durableSnapshot.accounts.map(account => account.did),
    )
    for (const account of next.accounts) {
      if (!durableDids.has(account.did)) {
        this.maybeOrphanedDids.add(account.did)
      }
    }
  }

  private setDurable(snapshot: SessionSnapshot) {
    this.snapshot = snapshot
    this.durableSnapshot = snapshot
    this.maybeOrphanedDids.clear()
    this.pending = undefined
    this.cancelRetry()
  }

  private emitFailure(error: SessionStorageError) {
    this.writeFailureListeners.forEach(listener => listener(error))
  }

  private attachRetryTriggers() {
    if (this.retryTriggersAttached) return
    this.retryTriggersAttached = true
    onAppStateChange(state => {
      if (state === 'active' && this.pending) this.retry()
    })
  }

  private scheduleRetry() {
    if (this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      this.retry()
    }, RETRY_DELAY)
  }

  private cancelRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = undefined
  }
}

export function createSessionRepository(): SessionRepository {
  return new NativeSessionRepository()
}

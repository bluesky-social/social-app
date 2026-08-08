import {createStore, update} from 'idb-keyval'

import BroadcastChannel from '#/lib/broadcast'
import {
  InvalidSessionStorageDataError,
  logStorageError,
  storageError,
} from './errors'
import {mergeSnapshots} from './merge'
import {type SessionSnapshot, sessionSnapshotSchema} from './schema'
import {type SessionRepository, type SessionStorageError} from './types'

const STORAGE_KEY = 'BSKY_SESSION_STORAGE_V1'
const STORAGE_LOCK_NAME = `bsky-session:${STORAGE_KEY}`
const fallbackLockStore = createStore('BSKY_SESSION_STORAGE_LOCKS', 'locks')
const CHANNEL_NAME = 'BSKY_SESSION_BROADCAST_CHANNEL'
const UPDATE_EVENT = 'session-update-v1'
const EMPTY_SNAPSHOT: SessionSnapshot = {accounts: [], currentDid: undefined}
const RETRY_DELAY = 5_000

/**
 * A unit of pending work. A write carries its merge base so a retry rebases
 * against the same base even after other tabs have moved storage. A clear is a
 * replacement that unconditionally writes the empty snapshot.
 */
type PendingWork =
  | {type: 'write'; base: SessionSnapshot; next: SessionSnapshot}
  | {type: 'clear'}

/**
 * Web session repository. Persists to a dedicated localStorage key, serializes
 * writes across tabs under navigator.locks (falling back to an idb-keyval
 * mutex), and folds concurrent changes together with a three-way merge. Other
 * tabs are notified over a BroadcastChannel and the native storage event.
 */
export class WebSessionRepository implements SessionRepository {
  private snapshot: SessionSnapshot = EMPTY_SNAPSHOT
  private base: SessionSnapshot = EMPTY_SNAPSHOT
  private pending: PendingWork | undefined
  private active = new Map<
    PendingWork,
    Promise<SessionStorageError | undefined>
  >()
  private subscribers = new Set<(snapshot: SessionSnapshot) => void>()
  private writeFailureListeners = new Set<
    (error: SessionStorageError) => void
  >()
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private listenersAttached = false
  private onDurable: (() => void) | undefined
  private durableSignaled = false
  private broadcast = new BroadcastChannel(CHANNEL_NAME)

  async init(
    legacy: SessionSnapshot,
    onDurable: () => void,
  ): Promise<SessionSnapshot> {
    this.onDurable = onDurable
    let stored: SessionSnapshot | undefined
    let corrupt = false
    try {
      stored = readFromStorage()
    } catch (cause) {
      logStorageError(storageError('init', cause))
      // A corrupt dedicated session key proves migration already committed, so
      // do not resurrect legacy credentials. If localStorage itself is
      // unavailable, keep the legacy snapshot alive in memory for this tab.
      corrupt = cause instanceof InvalidSessionStorageDataError
      stored = undefined
    }
    if (stored) {
      this.snapshot = stored
      this.base = stored
      this.signalDurable()
    } else {
      this.snapshot = corrupt ? EMPTY_SNAPSHOT : legacy
      this.base = this.snapshot
      // Persist the initial snapshot and only signal durability once it lands.
      // On an unavailable store this fails and keeps retrying in the background.
      await this.beginInitialPersist()
    }
    this.attachListeners()
    return this.snapshot
  }

  getSnapshot(): SessionSnapshot {
    return this.snapshot
  }

  write(next: SessionSnapshot): void {
    if (this.pending?.type === 'clear') {
      // A requested wipe is still settling. Drop writes so we never resurrect a
      // session; retry the clear instead.
      this.snapshot = EMPTY_SNAPSHOT
      void this.retry()
      return
    }
    this.snapshot = next
    // Keep the original base across a superseded pending write (latest-wins).
    const base = this.pending ? this.pending.base : this.base
    const op: PendingWork = {type: 'write', base, next}
    this.pending = op
    this.cancelRetry()
    void this.persistOperation(op, 'write')
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

  async clear(): Promise<void> {
    this.snapshot = EMPTY_SNAPSHOT
    this.pending = {type: 'clear'}
    this.cancelRetry()
    const error = await this.persistOperation(this.pending, 'clear')
    if (error) {
      throw new Error(`session storage clear failed: ${error.kind}`)
    }
  }

  /**
   * Await the settling of all in-flight persist operations. Test-only helper;
   * the SessionRepository contract is fire-and-forget.
   */
  async whenSettled(): Promise<void> {
    while (this.active.size) {
      await Promise.allSettled([...this.active.values()])
    }
  }

  private async beginInitialPersist(): Promise<void> {
    const op: PendingWork = {
      type: 'write',
      base: this.snapshot,
      next: this.snapshot,
    }
    this.pending = op
    await this.persistOperation(op, 'init')
  }

  private persistOperation(
    op: PendingWork,
    operation: SessionStorageError['operation'],
  ): Promise<SessionStorageError | undefined> {
    const active = this.active.get(op)
    if (active) return active

    const promise = (async (): Promise<SessionStorageError | undefined> => {
      try {
        const committed =
          op.type === 'clear'
            ? await this.persistReplacement()
            : await this.persistCommit(op, operation)
        this.broadcast.postMessage({event: UPDATE_EVENT})
        if (this.pending === op) {
          this.snapshot = committed
          this.base = committed
          this.pending = undefined
          this.cancelRetry()
          if (
            op.type === 'write' &&
            JSON.stringify(committed) !== JSON.stringify(op.next)
          ) {
            // The merge changed what we asked to write; converge the caller.
            this.notify(committed)
          }
          this.signalDurable()
        }
        return undefined
      } catch (cause) {
        const error = storageError(operation, cause)
        logStorageError(error)
        this.emitFailure(error)
        if (this.pending === op) this.scheduleRetry()
        return error
      } finally {
        this.active.delete(op)
      }
    })()
    this.active.set(op, promise)
    return promise
  }

  private persistCommit(
    op: {base: SessionSnapshot; next: SessionSnapshot},
    operation: SessionStorageError['operation'],
  ): Promise<SessionSnapshot> {
    return withStorageLock(() => {
      let theirs: SessionSnapshot
      try {
        theirs = readFromStorage() ?? op.base
      } catch (cause) {
        if (!(cause instanceof InvalidSessionStorageDataError)) throw cause
        logStorageError(storageError(operation, cause))
        theirs = op.base
      }
      const committed = mergeSnapshots(op.base, op.next, theirs)
      writeToStorage(committed)
      return committed
    })
  }

  private persistReplacement(): Promise<SessionSnapshot> {
    return withStorageLock(() => {
      writeToStorage(EMPTY_SNAPSHOT)
      return EMPTY_SNAPSHOT
    })
  }

  private async retry(): Promise<void> {
    if (!this.pending) return
    await this.persistOperation(this.pending, 'retry')
  }

  private onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) this.receiveExternalUpdate()
  }

  private onBroadcastMessage = ({data}: MessageEvent<unknown>) => {
    if (
      typeof data === 'object' &&
      data !== null &&
      'event' in data &&
      data.event === UPDATE_EVENT
    ) {
      this.receiveExternalUpdate()
    }
  }

  private receiveExternalUpdate() {
    try {
      const theirs = readFromStorage()
      if (this.pending) {
        // Fold the external change into our pending write via a retry.
        if (!this.active.has(this.pending)) void this.retry()
        return
      }
      if (!theirs || JSON.stringify(theirs) === JSON.stringify(this.snapshot)) {
        return
      }
      this.snapshot = theirs
      this.base = theirs
      this.cancelRetry()
      this.notify(theirs)
    } catch (cause) {
      logStorageError(storageError('init', cause))
    }
  }

  private notify(snapshot: SessionSnapshot) {
    this.subscribers.forEach(listener => listener(snapshot))
  }

  private emitFailure(error: SessionStorageError) {
    this.writeFailureListeners.forEach(listener => listener(error))
  }

  private signalDurable() {
    if (this.durableSignaled) return
    this.durableSignaled = true
    this.onDurable?.()
  }

  private attachListeners() {
    if (this.listenersAttached) return
    this.listenersAttached = true
    this.broadcast.onmessage = this.onBroadcastMessage
    window.addEventListener('storage', this.onStorage)
  }

  private scheduleRetry() {
    if (this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      void this.retry()
    }, RETRY_DELAY)
  }

  private cancelRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = undefined
  }
}

function withStorageLock<T>(callback: () => T): Promise<T> {
  const locks = globalThis.navigator?.locks
  if (locks) return locks.request(STORAGE_LOCK_NAME, callback)

  let result: T
  return update<boolean>(
    STORAGE_LOCK_NAME,
    previous => {
      result = callback()
      return !previous
    },
    fallbackLockStore,
  ).then(() => result!)
}

function readFromStorage(): SessionSnapshot | undefined {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return undefined
  try {
    return sessionSnapshotSchema.parse(JSON.parse(raw))
  } catch {
    throw new InvalidSessionStorageDataError()
  }
}

function writeToStorage(snapshot: SessionSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function createSessionRepository(): SessionRepository {
  return new WebSessionRepository()
}

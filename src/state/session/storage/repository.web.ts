import BroadcastChannel from '#/lib/broadcast'
import {logger} from '#/logger'
import {type SessionSnapshot, sessionSnapshotSchema} from './schema'
import {
  type SessionRepository,
  type SessionStorageCommitResult,
  type SessionStorageError,
  type SessionStorageLoadResult,
} from './types'

const STORAGE_KEY = 'BSKY_SESSION_STORAGE_V1'
const CHANNEL_NAME = 'BSKY_SESSION_BROADCAST_CHANNEL'
const UPDATE_EVENT = 'session-update-v1'
const EMPTY_SNAPSHOT: SessionSnapshot = {accounts: [], currentDid: undefined}
const RETRY_DELAY = 5_000

export class WebSessionRepository implements SessionRepository {
  private snapshot: SessionSnapshot = EMPTY_SNAPSHOT
  private pendingSnapshot: SessionSnapshot | undefined
  private listeners = new Set<(snapshot: SessionSnapshot) => void>()
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private opened = false
  private broadcast = new BroadcastChannel(CHANNEL_NAME)

  // async to keep one repository contract across native and web.
  // eslint-disable-next-line @typescript-eslint/require-await
  async open(legacy?: SessionSnapshot): Promise<SessionStorageLoadResult> {
    try {
      const stored = readFromStorage()
      if (stored) {
        this.snapshot = stored
      } else {
        this.snapshot = legacy ?? EMPTY_SNAPSHOT
        writeToStorage(this.snapshot)
      }
      if (!this.opened) {
        this.opened = true
        this.broadcast.onmessage = this.onBroadcastMessage
        window.addEventListener('storage', this.onStorage)
      }
      return {
        status: 'ready',
        snapshot: this.snapshot,
        shouldScrubLegacy: Boolean(legacy?.accounts.length),
      }
    } catch (cause) {
      const error = storageError('open', cause)
      logStorageError(error)
      return {status: 'unavailable', error}
    }
  }

  getSnapshot(): SessionSnapshot {
    return this.snapshot
  }

  commit(
    _previous: SessionSnapshot,
    next: SessionSnapshot,
  ): SessionStorageCommitResult {
    this.snapshot = next
    try {
      writeToStorage(next)
      this.pendingSnapshot = undefined
      this.cancelRetry()
      this.broadcast.postMessage({event: UPDATE_EVENT})
      return {status: 'committed'}
    } catch (cause) {
      this.pendingSnapshot = next
      const error = storageError('commit', cause)
      logStorageError(error)
      this.scheduleRetry()
      return {status: 'pending', error}
    }
  }

  retryPending(): SessionStorageCommitResult {
    if (!this.pendingSnapshot) return {status: 'committed'}
    const next = this.pendingSnapshot
    try {
      writeToStorage(next)
      this.pendingSnapshot = undefined
      this.cancelRetry()
      this.broadcast.postMessage({event: UPDATE_EVENT})
      return {status: 'committed'}
    } catch (cause) {
      const error = storageError('retry', cause)
      logStorageError(error)
      this.scheduleRetry()
      return {status: 'pending', error}
    }
  }

  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async clear(): Promise<void> {
    try {
      writeToStorage(EMPTY_SNAPSHOT)
      this.snapshot = EMPTY_SNAPSHOT
      this.pendingSnapshot = undefined
      this.cancelRetry()
      this.broadcast.postMessage({event: UPDATE_EVENT})
    } catch (cause) {
      const error = storageError('clear', cause)
      logStorageError(error)
      throw cause
    }
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
      const next = readFromStorage()
      if (!next || JSON.stringify(next) === JSON.stringify(this.snapshot)) {
        return
      }
      this.snapshot = next
      this.pendingSnapshot = undefined
      this.cancelRetry()
      this.listeners.forEach(listener => listener(next))
    } catch (cause) {
      logStorageError(storageError('open', cause))
    }
  }

  private scheduleRetry() {
    if (this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      this.retryPending()
    }, RETRY_DELAY)
  }

  private cancelRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = undefined
  }
}

function readFromStorage(): SessionSnapshot | undefined {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? sessionSnapshotSchema.parse(JSON.parse(raw)) : undefined
}

function writeToStorage(snapshot: SessionSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

function storageError(
  operation: SessionStorageError['operation'],
  cause: unknown,
): SessionStorageError {
  const message = cause instanceof Error ? cause.message : String(cause)
  const kind = /quota|disk.*full|storage.*full|no space/i.test(message)
    ? 'storage-full'
    : operation === 'open'
      ? 'unavailable'
      : 'write-failed'
  return {kind, operation}
}

function logStorageError(error: SessionStorageError) {
  logger.error('session storage operation failed', {
    kind: error.kind,
    operation: error.operation,
    tags: {
      session_storage_kind: error.kind,
      session_storage_operation: error.operation,
    },
  })
}

export function createSessionRepository(): SessionRepository {
  return new WebSessionRepository()
}

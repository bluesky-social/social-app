import {createStore, update} from 'idb-keyval'

import BroadcastChannel from '#/lib/broadcast'
import {logger} from '#/logger'
import {
  type SessionAccount,
  sessionAccountSchema,
  type SessionSnapshot,
  sessionSnapshotSchema,
} from './schema'
import {
  type SessionRepository,
  type SessionStorageCommitResult,
  type SessionStorageError,
  type SessionStorageLoadResult,
} from './types'

const STORAGE_KEY = 'BSKY_SESSION_STORAGE_V1'
const STORAGE_LOCK_NAME = `bsky-session:${STORAGE_KEY}`
const fallbackLockStore = createStore('BSKY_SESSION_STORAGE_LOCKS', 'locks')
const CHANNEL_NAME = 'BSKY_SESSION_BROADCAST_CHANNEL'
const UPDATE_EVENT = 'session-update-v1'
const EMPTY_SNAPSHOT: SessionSnapshot = {accounts: [], currentDid: undefined}
const RETRY_DELAY = 5_000

type PendingCommit = {
  previous: SessionSnapshot
  next: SessionSnapshot
  replace?: boolean
}

export class WebSessionRepository implements SessionRepository {
  private snapshot: SessionSnapshot = EMPTY_SNAPSHOT
  private pendingCommit: PendingCommit | undefined
  private activeOperations = new Map<
    PendingCommit,
    Promise<SessionStorageCommitResult>
  >()
  private listeners = new Set<(snapshot: SessionSnapshot) => void>()
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private opened = false
  private legacyMigrationPending = false
  private onLegacyMigrationComplete: (() => void) | undefined
  private broadcast = new BroadcastChannel(CHANNEL_NAME)

  async open(
    legacy?: SessionSnapshot,
    onLegacyMigrationComplete?: () => void,
  ): Promise<SessionStorageLoadResult> {
    this.onLegacyMigrationComplete = onLegacyMigrationComplete
    let shouldScrubLegacy = false
    try {
      const stored = readFromStorage()
      if (stored) {
        this.snapshot = stored
        shouldScrubLegacy = Boolean(legacy?.accounts.length)
      } else {
        this.snapshot = legacy ?? EMPTY_SNAPSHOT
        shouldScrubLegacy =
          (await this.persistInitialSnapshot(this.snapshot)) &&
          Boolean(legacy?.accounts.length)
        this.legacyMigrationPending =
          !shouldScrubLegacy && Boolean(legacy?.accounts.length)
      }
    } catch (cause) {
      logStorageError(storageError('open', cause))
      // A corrupt dedicated session key proves migration already committed;
      // do not resurrect legacy credentials. If localStorage itself is
      // unavailable, keep the legacy snapshot alive in memory for this tab.
      this.snapshot =
        cause instanceof InvalidWebSessionStorageDataError
          ? EMPTY_SNAPSHOT
          : (legacy ?? EMPTY_SNAPSHOT)
      shouldScrubLegacy =
        (await this.persistInitialSnapshot(this.snapshot)) &&
        Boolean(legacy?.accounts.length)
      this.legacyMigrationPending =
        !shouldScrubLegacy && Boolean(legacy?.accounts.length)
    }
    this.attachListeners()
    return {status: 'ready', snapshot: this.snapshot, shouldScrubLegacy}
  }

  getSnapshot(): SessionSnapshot {
    return this.snapshot
  }

  async commit(
    previous: SessionSnapshot,
    next: SessionSnapshot,
  ): Promise<SessionStorageCommitResult> {
    if (this.pendingCommit?.replace) {
      this.snapshot = this.pendingCommit.next
      return this.retryPending()
    }
    this.snapshot = next
    const base = this.pendingCommit?.previous ?? previous
    const operation = {previous: base, next}
    this.pendingCommit = operation
    this.cancelRetry()
    return this.persistOperation(operation, 'commit')
  }

  async retryPending(): Promise<SessionStorageCommitResult> {
    if (!this.pendingCommit) return {status: 'committed'}
    return this.persistOperation(this.pendingCommit, 'retry')
  }

  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async clear(): Promise<void> {
    this.snapshot = EMPTY_SNAPSHOT
    this.pendingCommit = {
      previous: EMPTY_SNAPSHOT,
      next: EMPTY_SNAPSHOT,
      replace: true,
    }
    this.cancelRetry()
    const result = await this.persistOperation(this.pendingCommit, 'clear')
    if (result.status === 'pending') {
      throw new Error(`session storage clear failed: ${result.error.kind}`)
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
      if (this.pendingCommit) {
        if (!this.activeOperations.has(this.pendingCommit)) {
          void this.retryPending()
        }
        return
      }
      if (!next || JSON.stringify(next) === JSON.stringify(this.snapshot)) {
        return
      }
      this.snapshot = next
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
      void this.retryPending()
    }, RETRY_DELAY)
  }

  private cancelRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = undefined
  }

  private attachListeners() {
    if (this.opened) return
    this.opened = true
    this.broadcast.onmessage = this.onBroadcastMessage
    window.addEventListener('storage', this.onStorage)
  }

  private async persistInitialSnapshot(
    snapshot: SessionSnapshot,
  ): Promise<boolean> {
    const operation = {previous: snapshot, next: snapshot}
    this.pendingCommit = operation
    const result = await this.persistOperation(operation, 'open')
    return result.status === 'committed'
  }

  private async persistOperation(
    operation: PendingCommit,
    errorOperation: SessionStorageError['operation'],
  ): Promise<SessionStorageCommitResult> {
    const active = this.activeOperations.get(operation)
    if (active) return active

    const promise = (async (): Promise<SessionStorageCommitResult> => {
      try {
        const committed = operation.replace
          ? await this.persistReplacement(operation.next)
          : await this.persistCommit(
              operation.previous,
              operation.next,
              errorOperation,
            )
        this.broadcast.postMessage({event: UPDATE_EVENT})
        if (this.pendingCommit === operation) {
          this.snapshot = committed
          this.pendingCommit = undefined
          this.cancelRetry()
          if (JSON.stringify(committed) !== JSON.stringify(operation.next)) {
            this.listeners.forEach(listener => listener(committed))
          }
          if (this.legacyMigrationPending) {
            this.legacyMigrationPending = false
            this.onLegacyMigrationComplete?.()
          }
        }
        return {status: 'committed'}
      } catch (cause) {
        const error = storageError(errorOperation, cause)
        logStorageError(error)
        if (this.pendingCommit === operation) this.scheduleRetry()
        return {status: 'pending', error}
      } finally {
        this.activeOperations.delete(operation)
      }
    })()
    this.activeOperations.set(operation, promise)
    return promise
  }

  private persistCommit(
    previous: SessionSnapshot,
    next: SessionSnapshot,
    errorOperation: SessionStorageError['operation'],
  ): Promise<SessionSnapshot> {
    return withStorageLock(() => {
      let latest: SessionSnapshot
      try {
        latest = readFromStorage() ?? previous
      } catch (cause) {
        if (!(cause instanceof InvalidWebSessionStorageDataError)) throw cause
        logStorageError(storageError(errorOperation, cause))
        latest = previous
      }
      const committed = rebaseSessionSnapshot(previous, next, latest)
      writeToStorage(committed)
      return committed
    })
  }

  private persistReplacement(next: SessionSnapshot): Promise<SessionSnapshot> {
    return withStorageLock(() => {
      writeToStorage(next)
      return next
    })
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
    throw new InvalidWebSessionStorageDataError()
  }
}

function writeToStorage(snapshot: SessionSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

class InvalidWebSessionStorageDataError extends Error {}

const ACCOUNT_KEYS = [
  'service',
  'did',
  'handle',
  'email',
  'emailConfirmed',
  'emailAuthFactor',
  'refreshJwt',
  'accessJwt',
  'signupQueued',
  'active',
  'status',
  'pdsUrl',
  'isSelfHosted',
] as const satisfies readonly (keyof SessionAccount)[]

export function rebaseSessionSnapshot(
  previous: SessionSnapshot,
  next: SessionSnapshot,
  latest: SessionSnapshot,
): SessionSnapshot {
  const previousByDid = new Map(
    previous.accounts.map(account => [account.did, account]),
  )
  const nextByDid = new Map(
    next.accounts.map(account => [account.did, account]),
  )
  const resultByDid = new Map(
    latest.accounts.map(account => [account.did, account]),
  )

  for (const did of previousByDid.keys()) {
    if (!nextByDid.has(did)) resultByDid.delete(did)
  }
  for (const account of next.accounts) {
    const prior = previousByDid.get(account.did)
    if (!prior) {
      const latestAccount = resultByDid.get(account.did)
      const mergedAccount = latestAccount
        ? {
            ...latestAccount,
            ...account,
            refreshJwt:
              latestAccount.refreshJwt && account.refreshJwt
                ? account.refreshJwt
                : undefined,
            accessJwt:
              latestAccount.accessJwt && account.accessJwt
                ? account.accessJwt
                : undefined,
          }
        : account
      resultByDid.set(account.did, sessionAccountSchema.parse(mergedAccount))
      continue
    }
    if (JSON.stringify(prior) === JSON.stringify(account)) continue
    const latestAccount = resultByDid.get(account.did)
    if (!latestAccount) {
      // A concurrent removal wins over an edit based on the removed account.
      continue
    }
    let rebasedAccount = latestAccount
    for (const key of ACCOUNT_KEYS) {
      if (prior[key] !== account[key]) {
        const isCredential = key === 'refreshJwt' || key === 'accessJwt'
        const remotelyRevoked =
          isCredential &&
          prior[key] !== latestAccount[key] &&
          !latestAccount[key]
        if (!remotelyRevoked) {
          rebasedAccount = {...rebasedAccount, [key]: account[key]}
        }
      }
    }
    resultByDid.set(account.did, sessionAccountSchema.parse(rebasedAccount))
  }

  const previousOrder = previous.accounts.map(account => account.did)
  const nextOrder = next.accounts.map(account => account.did)
  const latestOrder = latest.accounts.map(account => account.did)
  const latestDids = new Set(latestOrder)
  const orderChanged =
    JSON.stringify(previousOrder) !== JSON.stringify(nextOrder)
  const order = orderChanged
    ? [...nextOrder, ...latestOrder.filter(did => !nextByDid.has(did))]
    : [...latestOrder, ...nextOrder.filter(did => !latestDids.has(did))]
  const accounts = order.flatMap(did => {
    const account = resultByDid.get(did)
    return account ? [account] : []
  })

  let currentDid =
    previous.currentDid === next.currentDid
      ? latest.currentDid
      : next.currentDid
  if (currentDid && !resultByDid.has(currentDid)) currentDid = undefined
  return sessionSnapshotSchema.parse({accounts, currentDid})
}

function storageError(
  operation: SessionStorageError['operation'],
  cause: unknown,
): SessionStorageError {
  const message = cause instanceof Error ? cause.message : String(cause)
  const kind =
    cause instanceof InvalidWebSessionStorageDataError
      ? 'invalid-data'
      : /quota|disk.*full|storage.*full|no space/i.test(message)
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

import * as SecureStore from 'expo-secure-store'
import {z} from 'zod'

import {onAppStateChange} from '#/lib/appState'
import {logger} from '#/logger'
import {accountKeys, SESSION_INDEX_KEY} from './keys'
import {
  type SessionAccount,
  sessionAccountSchema,
  type SessionSnapshot,
} from './schema'
import {
  type SessionRepository,
  type SessionStorageCommitResult,
  type SessionStorageError,
  type SessionStorageLoadResult,
} from './types'

const indexSchema = z.object({
  version: z.literal(1),
  currentDid: z.string().optional(),
  dids: z.array(z.string()),
  retiredDids: z.array(z.string()).optional(),
  revokedDids: z.array(z.string()).optional(),
})
const descriptorSchema = sessionAccountSchema.omit({
  accessJwt: true,
  refreshJwt: true,
})

type StoredIndex = z.infer<typeof indexSchema>
type AccountDescriptor = Omit<SessionAccount, 'accessJwt' | 'refreshJwt'>

const EMPTY_SNAPSHOT: SessionSnapshot = {accounts: [], currentDid: undefined}
const RETRY_DELAY = 5_000

export class NativeSessionRepository implements SessionRepository {
  private snapshot: SessionSnapshot = EMPTY_SNAPSHOT
  private persistedSnapshot: SessionSnapshot = EMPTY_SNAPSHOT
  private hasPersistedIndex = false
  private pendingSnapshot: SessionSnapshot | undefined
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private listeners = new Set<(snapshot: SessionSnapshot) => void>()

  constructor() {
    onAppStateChange(state => {
      if (state === 'active' && this.pendingSnapshot) {
        this.retryPending()
      }
    })
  }

  // async to keep one repository contract across native and web.
  // eslint-disable-next-line @typescript-eslint/require-await
  async open(legacy?: SessionSnapshot): Promise<SessionStorageLoadResult> {
    try {
      const rawIndex = SecureStore.getItem(SESSION_INDEX_KEY)
      if (rawIndex !== null) {
        let snapshot: SessionSnapshot
        try {
          snapshot = this.readSnapshot(rawIndex)
        } catch (cause) {
          if (!(cause instanceof InvalidSessionStorageDataError)) throw cause
          logStorageError({kind: 'invalid-data', operation: 'open'})
          this.hasPersistedIndex = false
          this.snapshot = EMPTY_SNAPSHOT
          this.persistedSnapshot = EMPTY_SNAPSHOT
          // Index presence proves migration previously reached its commit
          // point. Never resurrect possibly stale credentials from the legacy
          // blob when repairing corrupt new-format data.
          return this.initializeSnapshot(
            EMPTY_SNAPSHOT,
            Boolean(legacy?.accounts.length),
          )
        }
        this.hasPersistedIndex = true
        this.snapshot = snapshot
        this.persistedSnapshot = snapshot
        this.pendingSnapshot = undefined
        this.cancelRetry()
        return {
          status: 'ready',
          snapshot,
          shouldScrubLegacy: Boolean(legacy?.accounts.length),
        }
      }

      return this.initializeSnapshot(legacy ?? EMPTY_SNAPSHOT)
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
      this.writeSnapshot(this.persistedSnapshot, next)
      this.persistedSnapshot = next
      this.hasPersistedIndex = true
      this.pendingSnapshot = undefined
      this.cancelRetry()
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
    if (!this.pendingSnapshot) {
      return {status: 'committed'}
    }
    const next = this.pendingSnapshot
    try {
      this.writeSnapshot(this.persistedSnapshot, next)
      this.persistedSnapshot = next
      this.hasPersistedIndex = true
      this.pendingSnapshot = undefined
      this.cancelRetry()
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
    const dids = [
      ...new Set([
        ...this.persistedSnapshot.accounts.map(account => account.did),
        ...this.snapshot.accounts.map(account => account.did),
      ]),
    ]
    try {
      SecureStore.setItem(
        SESSION_INDEX_KEY,
        JSON.stringify(toStoredIndex(EMPTY_SNAPSHOT, dids)),
      )
      dids.forEach(tombstoneAccount)
      SecureStore.setItem(
        SESSION_INDEX_KEY,
        JSON.stringify(toStoredIndex(EMPTY_SNAPSHOT)),
      )
      this.snapshot = EMPTY_SNAPSHOT
      this.persistedSnapshot = EMPTY_SNAPSHOT
      this.hasPersistedIndex = true
      this.pendingSnapshot = undefined
      this.cancelRetry()
    } catch (cause) {
      const error = storageError('clear', cause)
      logStorageError(error)
      throw cause
    }
  }

  private readSnapshot(rawIndex: string): SessionSnapshot {
    let index: StoredIndex
    try {
      index = indexSchema.parse(JSON.parse(rawIndex))
    } catch {
      throw new InvalidSessionStorageDataError()
    }
    if (index.revokedDids?.length) {
      const activeDids = new Set(index.dids)
      index.revokedDids
        .filter(did => activeDids.has(did))
        .forEach(tombstoneCredentials)
    }
    if (index.retiredDids?.length) {
      const activeDids = new Set(index.dids)
      index.retiredDids
        .filter(did => !activeDids.has(did))
        .forEach(tombstoneAccount)
    }
    if (index.revokedDids?.length || index.retiredDids?.length) {
      const cleanedIndex = {
        version: index.version,
        currentDid: index.currentDid,
        dids: index.dids,
      } satisfies StoredIndex
      SecureStore.setItem(SESSION_INDEX_KEY, JSON.stringify(cleanedIndex))
      index = cleanedIndex
    }
    if (index.currentDid && !index.dids.includes(index.currentDid)) {
      throw new InvalidSessionStorageDataError()
    }
    const accounts = index.dids.map(did => {
      const keys = accountKeys(did)
      const rawDescriptor = SecureStore.getItem(keys.descriptor)
      if (rawDescriptor === null) {
        throw new InvalidSessionStorageDataError()
      }
      let descriptor: AccountDescriptor
      try {
        descriptor = descriptorSchema.parse(JSON.parse(rawDescriptor))
      } catch {
        throw new InvalidSessionStorageDataError()
      }
      if (descriptor.did !== did) {
        throw new InvalidSessionStorageDataError()
      }
      return {
        ...descriptor,
        refreshJwt: SecureStore.getItem(keys.refresh) || undefined,
        accessJwt: SecureStore.getItem(keys.access) || undefined,
      }
    })
    return {accounts, currentDid: index.currentDid}
  }

  private writeSnapshot(previous: SessionSnapshot, next: SessionSnapshot) {
    const previousByDid = new Map(previous.accounts.map(a => [a.did, a]))
    const nextDids = new Set(next.accounts.map(a => a.did))
    const retiredDids = previous.accounts
      .filter(account => !nextDids.has(account.did))
      .map(account => account.did)
    const revokedDids = next.accounts
      .filter(account => {
        const prior = previousByDid.get(account.did)
        return (
          (Boolean(prior?.refreshJwt) && !account.refreshJwt) ||
          (Boolean(prior?.accessJwt) && !account.accessJwt)
        )
      })
      .map(account => account.did)

    if (revokedDids.length) {
      // Journal retained-account logout before clearing either credential.
      // On interruption, open() finishes the tombstoning before loading.
      SecureStore.setItem(
        SESSION_INDEX_KEY,
        JSON.stringify(toStoredIndex(next, retiredDids, revokedDids)),
      )
    }

    // Credentials go first. AtpAgent does not await its persistence callback,
    // so these must complete synchronously before the app can be suspended.
    for (const account of next.accounts) {
      const prior = previousByDid.get(account.did)
      const keys = accountKeys(account.did)
      if (prior?.refreshJwt !== account.refreshJwt) {
        SecureStore.setItem(keys.refresh, account.refreshJwt ?? '')
      }
      if (prior?.accessJwt !== account.accessJwt) {
        SecureStore.setItem(keys.access, account.accessJwt ?? '')
      }
      const descriptor = toDescriptor(account)
      if (JSON.stringify(toDescriptor(prior)) !== JSON.stringify(descriptor)) {
        SecureStore.setItem(keys.descriptor, JSON.stringify(descriptor))
      }
    }

    if (
      !this.hasPersistedIndex ||
      JSON.stringify(previous) !== JSON.stringify(next)
    ) {
      // Publishing the index is the commit point. `retiredDids` makes token
      // cleanup recoverable if the process stops between these sync writes.
      SecureStore.setItem(
        SESSION_INDEX_KEY,
        JSON.stringify(toStoredIndex(next, retiredDids)),
      )
    }

    if (retiredDids.length) {
      retiredDids.forEach(tombstoneAccount)
      SecureStore.setItem(
        SESSION_INDEX_KEY,
        JSON.stringify(toStoredIndex(next)),
      )
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

  private initializeSnapshot(
    snapshot: SessionSnapshot,
    shouldScrubLegacy = Boolean(snapshot.accounts.length),
  ): SessionStorageLoadResult {
    const result = this.commit(EMPTY_SNAPSHOT, snapshot)
    if (result.status === 'pending') {
      return {status: 'unavailable', error: result.error}
    }

    // Migration/recovery is complete only after every item reads back and
    // validates. The index also marks an intentionally empty session.
    const storedIndex = SecureStore.getItem(SESSION_INDEX_KEY)
    if (storedIndex === null) {
      return {
        status: 'unavailable',
        error: {kind: 'unavailable', operation: 'open'},
      }
    }
    const verified = this.readSnapshot(storedIndex)
    this.snapshot = verified
    this.persistedSnapshot = verified
    this.hasPersistedIndex = true
    return {
      status: 'ready',
      snapshot: verified,
      shouldScrubLegacy,
    }
  }
}

class InvalidSessionStorageDataError extends Error {}

function toDescriptor(
  account: SessionAccount | undefined,
): AccountDescriptor | undefined {
  if (!account) return undefined
  const {
    accessJwt: _accessJwt,
    refreshJwt: _refreshJwt,
    ...descriptor
  } = account
  return descriptor
}

function toStoredIndex(
  snapshot: SessionSnapshot,
  retiredDids: string[] = [],
  revokedDids: string[] = [],
): StoredIndex {
  return {
    version: 1,
    currentDid: snapshot.currentDid,
    dids: snapshot.accounts.map(account => account.did),
    ...(retiredDids.length ? {retiredDids} : {}),
    ...(revokedDids.length ? {revokedDids} : {}),
  }
}

function tombstoneAccount(did: string) {
  tombstoneCredentials(did)
  const keys = accountKeys(did)
  SecureStore.setItem(keys.descriptor, '')
}

function tombstoneCredentials(did: string) {
  const keys = accountKeys(did)
  SecureStore.setItem(keys.refresh, '')
  SecureStore.setItem(keys.access, '')
}

function storageError(
  operation: SessionStorageError['operation'],
  cause: unknown,
): SessionStorageError {
  const message = cause instanceof Error ? cause.message : String(cause)
  const kind =
    cause instanceof InvalidSessionStorageDataError
      ? 'invalid-data'
      : /quota|disk.*full|storage.*full|no space/i.test(message)
        ? 'storage-full'
        : operation === 'open'
          ? 'unavailable'
          : 'write-failed'
  return {kind, operation}
}

function logStorageError(error: SessionStorageError) {
  // Never attach the underlying native error: some platforms include the key
  // in it. Keys are hashed, but keeping telemetry credential-agnostic is safer.
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
  return new NativeSessionRepository()
}

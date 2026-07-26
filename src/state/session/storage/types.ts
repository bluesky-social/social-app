import {type SessionSnapshot} from './schema'

export type SessionStorageErrorKind =
  | 'unavailable'
  | 'invalid-data'
  | 'storage-full'
  | 'write-failed'

export type SessionStorageError = {
  kind: SessionStorageErrorKind
  operation: 'open' | 'commit' | 'retry' | 'clear'
}

export type SessionStorageLoadResult =
  | {
      status: 'ready'
      snapshot: SessionSnapshot
      shouldScrubLegacy: boolean
    }
  | {
      status: 'unavailable'
      error: SessionStorageError
    }

export type SessionStorageCommitResult =
  | {status: 'committed'}
  | {status: 'pending'; error: SessionStorageError}

export interface SessionRepository {
  open(legacy?: SessionSnapshot): Promise<SessionStorageLoadResult>
  getSnapshot(): SessionSnapshot
  commit(
    previous: SessionSnapshot,
    next: SessionSnapshot,
  ): SessionStorageCommitResult
  retryPending(): SessionStorageCommitResult
  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void
  clear(): Promise<void>
}

import {type SessionSnapshot} from './schema'

export type SessionStorageErrorKind =
  | 'unavailable'
  | 'invalid-data'
  | 'storage-full'
  | 'write-failed'

export type SessionStorageError = {
  kind: SessionStorageErrorKind
  operation: 'init' | 'write' | 'retry' | 'clear'
}

export interface SessionRepository {
  /**
   * Load sessions from storage, performing crash recovery and one-time
   * migration from `legacy`. `onDurable` fires exactly once, when data is
   * known durably stored in the new format (possibly after a later retry) -
   * the caller uses it to scrub the legacy location. Rejects if storage is
   * unavailable; safe to call again to retry.
   */
  init(legacy: SessionSnapshot, onDurable: () => void): Promise<SessionSnapshot>
  getSnapshot(): SessionSnapshot
  /**
   * Persist a snapshot. Fire-and-forget: failures surface via onWriteFailure
   * and retry automatically. The latest write wins.
   */
  write(next: SessionSnapshot): void
  /** The stored snapshot changed externally (another tab). Never fires on native. */
  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void
  /** A persist attempt failed; a retry is scheduled. */
  onWriteFailure(listener: (error: SessionStorageError) => void): () => void
  /** Erase all session data, including leftovers from interrupted writes. */
  clear(): Promise<void>
}

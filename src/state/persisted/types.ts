import {type Schema} from './schema'
import {type SessionCredentialMutation} from './session'

export type PersistedApi = {
  init(): Promise<void>
  get<K extends keyof Schema>(key: K): Schema[K]
  /**
   * Like {@link get}, but on web forces a fresh synchronous re-read of the
   * backing store before returning (without adopting it as the in-memory
   * state). This exists for the cross-tab expiry-rescue path: a frozen tab may
   * not have processed a queued broadcast yet, so {@link get} can be stale
   * while another tab has already written healthy tokens to storage. On native
   * it is identical to {@link get} (single-instance, no other writer).
   */
  readLatest<K extends keyof Schema>(key: K): Schema[K]
  write<K extends keyof Schema>(key: K, value: Schema[K]): Promise<void>
  updateSession(params: {
    nextSession: Schema['session']
    credentialMutations: SessionCredentialMutation[]
  }): Promise<Schema['session']>
  runWithSessionCredentialLock<T>(params: {
    accountDids: string[]
    operation: () => T | Promise<T>
  }): Promise<T>
  onUpdate<K extends keyof Schema>(
    key: K,
    cb: (v: Schema[K]) => void,
  ): () => void
  clearStorage: () => Promise<void>
}

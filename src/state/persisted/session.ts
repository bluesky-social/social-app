import * as persisted from './index'
import {type Schema} from './schema'
import {type SessionCredentialMutation} from './session-merge'

export type {SessionCredentialMutation} from './session-merge'
export {runWithPersistedStorageLock as runWithCredentialLock} from './storage-lock'

export function read(): Schema['session'] {
  return persisted.get('session')
}

/** On web, synchronously read the authoritative localStorage session. */
export function readLatest(): Schema['session'] {
  return persisted.readLatest('session')
}

/** Conditionally commit a session update inside {@link runWithCredentialLock}. */
export function write({
  nextSession,
  credentialMutations,
}: {
  nextSession: Schema['session']
  credentialMutations: SessionCredentialMutation[]
}): Promise<Schema['session']> {
  return persisted.writeSessionInternal({
    nextSession,
    credentialMutations,
  })
}

export function onUpdate(
  callback: (session: Schema['session']) => void,
): () => void {
  return persisted.onUpdate('session', callback)
}

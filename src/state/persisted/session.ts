import * as persisted from './index'
import {type Schema} from './schema'
import {runWithSessionCredentialLock} from './session-lock'
import {type SessionCredentialMutation} from './session-merge'

export type {SessionCredentialMutation} from './session-merge'

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

export function runWithCredentialLock<T>({
  accountDids,
  operation,
}: {
  accountDids: string[]
  operation: () => T | Promise<T>
}): Promise<T> {
  return runWithSessionCredentialLock({accountDids, operation})
}

export function onUpdate(
  callback: (session: Schema['session']) => void,
): () => void {
  return persisted.onUpdate('session', callback)
}

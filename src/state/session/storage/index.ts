import * as persisted from '#/state/persisted'
import {createSessionRepository} from './repository'
import {type SessionSnapshot} from './schema'

const repository = createSessionRepository()
let initialized = false

/**
 * Initialize the session repository, migrating from the legacy persisted blob
 * and scrubbing it once the new store is durable. Rejects if storage is
 * unavailable; the app-level bootstrap retries, and this is safe to call again.
 */
export async function initSessionRepository() {
  if (initialized) return repository

  const legacy = persisted.get('session')
  const legacyCurrentDid = legacy.currentAccount?.did
  const legacySnapshot: SessionSnapshot = {
    accounts: legacy.accounts,
    currentDid: legacy.accounts.some(
      account => account.did === legacyCurrentDid,
    )
      ? legacyCurrentDid
      : undefined,
  }

  await repository.init(legacySnapshot, () => {
    // Fires once the new store is known durable. Scrub the old blob so future
    // preference writes cannot keep rewriting bearer credentials. Only needed
    // when the legacy location actually held accounts.
    if (legacySnapshot.accounts.length > 0) {
      void persisted.write('session', {
        accounts: [],
        currentAccount: undefined,
      })
    }
  })

  initialized = true
  return repository
}

export function getSessionRepository() {
  if (!initialized) {
    throw new Error('session repository used before initialization')
  }
  return repository
}

export type {SessionSnapshot} from './schema'
export type {SessionRepository} from './types'

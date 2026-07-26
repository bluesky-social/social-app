import * as persisted from '#/state/persisted'
import {createSessionRepository} from './repository'
import {type SessionSnapshot} from './schema'

const repository = createSessionRepository()
let initialized = false

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
  const scrubLegacy = () =>
    persisted.write('session', {
      accounts: [],
      currentAccount: undefined,
    })
  const result = await repository.open(legacySnapshot, () => {
    void scrubLegacy()
  })
  if (result.status === 'unavailable') {
    throw new Error(`session storage unavailable: ${result.error.kind}`)
  }

  if (result.shouldScrubLegacy) {
    // The new repository has been read back successfully. Scrub the old blob
    // so future preference writes cannot keep rewriting bearer credentials.
    await scrubLegacy()
  }
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

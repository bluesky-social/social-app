import {PasswordSession} from '@atproto/lex-password-session'

import {isJwtExpired} from '#/lib/jwt'
import * as persisted from '#/state/persisted'
import {
  networkAwareFetch,
  sessionAccountToSessionData,
  SessionAgent,
} from './session-core'
import {type SessionAccount} from './types'

/*
 * Canonical implementation moved to session-core.ts so that module stays
 * dependency-light (this file pulls in agent.ts and, transitively, a large
 * chunk of the app). Re-exported here for existing consumers.
 */
export {isSignupQueued} from './session-core'

export function readLastActiveAccount() {
  const {currentAccount, accounts} = persisted.get('session')
  return accounts.find(a => a.did === currentAccount?.did)
}

export function isSessionExpired(account: SessionAccount) {
  if (account.accessJwt) {
    return isJwtExpired(account.accessJwt)
  } else {
    return true
  }
}

/**
 * Creates and resumes a throwaway session for every stored account.
 * Intended to send push token revocations just before logout.
 *
 * Each returned {@link SessionAgent} wraps a temporary `PasswordSession`
 * resumed over the network to obtain a valid access token. These sessions are
 * deliberately hook-free (no `onUpdated`/`onDeleted`): they must NEVER persist
 * or race the active session. They are used once for the unregister call and
 * discarded (reclaimed by GC), so we never call `logout()` on them.
 */
export async function createTemporaryAgentsAndResume(
  accounts: SessionAccount[],
): Promise<SessionAgent[]> {
  const settled = await Promise.allSettled(
    accounts.map(async account => {
      const session = await PasswordSession.resume(
        sessionAccountToSessionData(account),
        {fetch: networkAwareFetch},
      )
      return new SessionAgent(session)
    }),
  )

  return settled
    .filter(x => x.status === 'fulfilled')
    .map(promise => promise.value)
}

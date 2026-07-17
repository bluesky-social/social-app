import {Client} from '@atproto/lex-client'
import {PasswordSession} from '@atproto/lex-password-session'

import {isJwtExpired} from '#/lib/jwt'
import {type TemporaryPushClient} from '#/lib/notifications/notifications'
import * as persisted from '#/state/persisted'
import {networkAwareFetch, sessionAccountToSessionData} from './session-core'
import {type SessionAccount} from './types'

/*
 * Canonical implementation moved to session-core.ts so that module stays
 * dependency-light (this file transitively pulls in a large chunk of the app).
 * Re-exported here for existing consumers.
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
 * Each returned {@link TemporaryPushClient} wraps a temporary `PasswordSession`
 * resumed over the network to obtain a valid access token. These sessions are
 * deliberately hook-free (no `onUpdated`/`onDeleted`): they must NEVER persist
 * or race the active session. They are used once for the unregister call and
 * discarded (reclaimed by GC), so we never call `logout()` on them.
 *
 * Each session is wrapped in a plain account-shaped `Client` (no proxy header)
 * paired with the account's service origin and handle, matching the contract
 * {@link unregisterPushToken} consumes.
 */
export async function createTemporaryClientsAndResume(
  accounts: SessionAccount[],
): Promise<TemporaryPushClient[]> {
  const settled = await Promise.allSettled(
    accounts.map(async account => {
      const session = await PasswordSession.resume(
        sessionAccountToSessionData(account),
        {fetch: networkAwareFetch},
      )
      return {
        client: new Client(session),
        service: session.session.service,
        handle: session.session.handle,
      } satisfies TemporaryPushClient
    }),
  )

  return settled
    .filter(x => x.status === 'fulfilled')
    .map(promise => promise.value)
}

import {PasswordSession} from '@atproto/lex-password-session'

import {createLexClient} from '#/lib/lexClient'
import {type TemporaryPushClient} from '#/lib/notifications/notifications'
import * as persisted from '#/state/persisted'
import {networkAwareFetch} from './network'
import {sessionAccountToSessionData} from './session-data'
import {type SessionAccount} from './types'

export {isSessionExpired, isSignupQueued} from './session-data'

export function readLastActiveAccount() {
  const {currentAccount, accounts} = persisted.get('session')
  return accounts.find(a => a.did === currentAccount?.did)
}

/**
 * Resume a single-use session per stored account, for the push-token revocation
 * sent just before logout.
 *
 * The sessions carry no lifecycle hooks - no `onUpdated`, no `onDeleted` - so a
 * rotation one of them performs can neither persist over nor race the live
 * session's tokens. That isolation is load-bearing: each exists only long enough
 * to authenticate one `unregisterPush` call.
 *
 * PDS routing is left to the session rather than pinned from the stored
 * `pdsUrl`, because `resume` refreshes (and fills in a missing didDoc from
 * `getSession`) before the client issues anything, so the request already goes
 * to the didDoc PDS.
 *
 * `resume` rejects only when a session is definitively dead; a transient network
 * failure resolves with the stored tokens, which are the same ones the old agent
 * path would have sent. Definitively dead sessions drop out of the settled list.
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
        client: createLexClient(session),
        service: session.session.service,
        handle: session.session.handle,
      } satisfies TemporaryPushClient
    }),
  )

  return settled
    .filter(x => x.status === 'fulfilled')
    .map(promise => promise.value)
}

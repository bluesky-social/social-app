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
 * Resume hook-free, single-use sessions for push-token revocation. They must
 * never persist or race the active session.
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

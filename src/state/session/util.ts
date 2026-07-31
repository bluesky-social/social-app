import AtpAgent from '@atproto/api'

import * as persisted from '#/state/persisted'
import {sessionAccountToSession} from './session-data'
import {type SessionAccount} from './types'

export {isSessionExpired, isSignupQueued} from './session-data'

export function readLastActiveAccount() {
  const {currentAccount, accounts} = persisted.get('session')
  return accounts.find(a => a.did === currentAccount?.did)
}

/**
 * Creates and attempted to resumeSession for every stored session.
 * Intended to be used to send push token revokations just before logout.
 */
export async function createTemporaryAgentsAndResume(
  accounts: SessionAccount[],
) {
  const agents = await Promise.allSettled(
    accounts.map(async account => {
      const agent: AtpAgent = new AtpAgent({service: account.service})
      if (account.pdsUrl) {
        agent.sessionManager.pdsUrl = new URL(account.pdsUrl)
      }

      const session = sessionAccountToSession(account)
      const res = await agent.resumeSession(session)
      if (!res.success) throw new Error('Failed to resume session')

      agent.assertAuthenticated() // confirm auth success

      return agent
    }),
  )

  return agents
    .filter(x => x.status === 'fulfilled')
    .map(promise => promise.value)
}

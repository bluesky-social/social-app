import {BSKY_LABELER_DID, BskyAgent} from '@atproto/api'
import {jwtDecode} from 'jwt-decode'

import {IS_TEST_USER} from '#/lib/constants'
import {hasProp} from '#/lib/type-guards'
import * as persisted from '#/state/persisted'
import {readLabelers} from '../agent-config'
import {SessionAccount} from '../types'

export function isSessionDeactivated(accessJwt: string | undefined) {
  if (accessJwt) {
    const sessData = jwtDecode(accessJwt)
    return (
      hasProp(sessData, 'scope') && sessData.scope === 'com.atproto.deactivated'
    )
  }
  return false
}

export function readLastActiveAccount() {
  const {currentAccount, accounts} = persisted.get('session')
  return accounts.find(a => a.did === currentAccount?.did)
}

export async function configureModeration(
  agent: BskyAgent,
  account?: SessionAccount,
) {
  if (account) {
    if (IS_TEST_USER(account.handle)) {
      const did = (
        await agent
          .resolveHandle({handle: 'mod-authority.test'})
          .catch(_ => undefined)
      )?.data.did
      if (did) {
        console.warn('USING TEST ENV MODERATION')
        BskyAgent.configure({appLabelers: [did]})
      }
    } else {
      BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
      const labelerDids = await readLabelers(account.did).catch(_ => {})
      if (labelerDids) {
        agent.configureLabelersHeader(
          labelerDids.filter(did => did !== BSKY_LABELER_DID),
        )
      }
    }
  } else {
    BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
  }
}

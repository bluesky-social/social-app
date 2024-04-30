import {BSKY_LABELER_DID, BskyAgent} from '@atproto/api'
import {jwtDecode} from 'jwt-decode'

import {IS_TEST_USER} from '#/lib/constants'
import {hasProp} from '#/lib/type-guards'
import {logger} from '#/logger'
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

export function configureModerationForGuest() {
  switchToBskyAppLabeler()
}

export async function configureModerationForAccount(
  agent: BskyAgent,
  account: SessionAccount,
) {
  switchToBskyAppLabeler()
  if (IS_TEST_USER(account.handle)) {
    await trySwitchToTestAppLabeler(agent)
  }

  const labelerDids = await readLabelers(account.did).catch(_ => {})
  if (labelerDids) {
    agent.configureLabelersHeader(
      labelerDids.filter(did => did !== BSKY_LABELER_DID),
    )
  } else {
    // If there are no headers in the storage, we'll not send them on the initial requests.
    // If we wanted to fix this, we could block on the preferences query here.
  }
}

function switchToBskyAppLabeler() {
  BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
}

async function trySwitchToTestAppLabeler(agent: BskyAgent) {
  const did = (
    await agent
      .resolveHandle({handle: 'mod-authority.test'})
      .catch(_ => undefined)
  )?.data.did
  if (did) {
    console.warn('USING TEST ENV MODERATION')
    BskyAgent.configure({appLabelers: [did]})
  }
}

export function isSessionExpired(account: SessionAccount) {
  let canReusePrevSession = false
  try {
    if (account.accessJwt) {
      const decoded = jwtDecode(account.accessJwt)
      if (decoded.exp) {
        const didExpire = Date.now() >= decoded.exp * 1000
        if (!didExpire) {
          canReusePrevSession = true
        }
      }
    }
  } catch (e) {
    logger.error(`session: could not decode jwt`)
  }

  return !canReusePrevSession
}

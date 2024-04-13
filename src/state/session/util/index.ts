import {BSKY_LABELER_DID, BskyAgent} from '@atproto/api'
import {jwtDecode} from 'jwt-decode'

import {IS_TEST_USER} from '#/lib/constants'
import {hasProp} from '#/lib/type-guards'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {readLabelers} from '#/state/session/agent-config'
import {SessionAccount, SessionApiContext} from '#/state/session/types'

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

export function agentToSessionAccount(
  agent: BskyAgent,
): SessionAccount | undefined {
  if (!agent.session) return undefined

  return {
    service: agent.service.toString(),
    did: agent.session.did,
    handle: agent.session.handle,
    email: agent.session.email,
    emailConfirmed: agent.session.emailConfirmed,
    deactivated: isSessionDeactivated(agent.session.accessJwt),
    refreshJwt: agent.session.refreshJwt,
    accessJwt: agent.session.accessJwt,
  }
}

export function sessionAccountToAgentSession(
  account: SessionAccount,
): BskyAgent['session'] {
  return {
    did: account.did,
    handle: account.handle,
    email: account.email,
    emailConfirmed: account.emailConfirmed,
    accessJwt: account.accessJwt || '',
    refreshJwt: account.refreshJwt || '',
  }
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

      if (account) {
        const labelerDids = await readLabelers(account.did).catch(_ => {})
        if (labelerDids) {
          agent.configureLabelersHeader(
            labelerDids.filter(did => did !== BSKY_LABELER_DID),
          )
        }
      }
    }
  } else {
    BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
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

export async function createAgentAndLogin({
  service,
  identifier,
  password,
}: {
  service: string
  identifier: string
  password: string
}) {
  const agent = new BskyAgent({service})
  await agent.login({identifier, password})

  if (!agent.session) {
    throw new Error(`session: login failed to establish a session`)
  }

  const account = agentToSessionAccount(agent)!
  await configureModeration(agent, account)

  return {
    agent,
    account,
  }
}

export async function createAgentAndCreateAccount({
  service,
  email,
  password,
  handle,
  inviteCode,
  verificationPhone,
  verificationCode,
}: Parameters<SessionApiContext['createAccount']>[0]) {
  const agent = new BskyAgent({service})

  await agent.createAccount({
    handle,
    password,
    email,
    inviteCode,
    verificationPhone,
    verificationCode,
  })

  if (!agent.session) {
    throw new Error(`session: createAccount failed to establish a session`)
  }

  const deactivated = isSessionDeactivated(agent.session.accessJwt)
  if (!deactivated) {
    /*dont await*/ agent.upsertProfile(_existing => {
      return {
        displayName: '',

        // HACKFIX
        // creating a bunch of identical profile objects is breaking the relay
        // tossing this unspecced field onto it to reduce the size of the problem
        // -prf
        createdAt: new Date().toISOString(),
      }
    })
  }

  const account = agentToSessionAccount(agent)!

  await configureModeration(agent, account)

  return {
    agent,
    account,
  }
}

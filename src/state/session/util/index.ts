import {BSKY_LABELER_DID, BskyAgent} from '@atproto/api'
import {jwtDecode} from 'jwt-decode'

import {IS_TEST_USER} from '#/lib/constants'
import {tryFetchGates} from '#/lib/statsig/statsig'
import {hasProp} from '#/lib/type-guards'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {readLabelers} from '../agent-config'
import {SessionAccount, SessionApiContext} from '../types'

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
    emailConfirmed: agent.session.emailConfirmed || false,
    emailAuthFactor: agent.session.emailAuthFactor || false,
    refreshJwt: agent.session.refreshJwt,
    accessJwt: agent.session.accessJwt,
    deactivated: isSessionDeactivated(agent.session.accessJwt),
    pdsUrl: agent.pdsUrl?.toString(),
  }
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
  try {
    if (account.accessJwt) {
      const decoded = jwtDecode(account.accessJwt)
      if (decoded.exp) {
        const didExpire = Date.now() >= decoded.exp * 1000
        return didExpire
      }
    }
  } catch (e) {
    logger.error(`session: could not decode jwt`)
  }
  return true
}

export async function createAgentAndLogin({
  service,
  identifier,
  password,
  authFactorToken,
}: {
  service: string
  identifier: string
  password: string
  authFactorToken?: string
}) {
  const agent = new BskyAgent({service})
  await agent.login({identifier, password, authFactorToken})

  const account = agentToSessionAccount(agent)
  if (!agent.session || !account) {
    throw new Error(`session: login failed to establish a session`)
  }

  const fetchingGates = tryFetchGates(account.did, 'prefer-fresh-gates')
  await configureModerationForAccount(agent, account)

  return {
    agent,
    account,
    fetchingGates,
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
    email,
    password,
    handle,
    inviteCode,
    verificationPhone,
    verificationCode,
  })

  const account = agentToSessionAccount(agent)!
  if (!agent.session || !account) {
    throw new Error(`session: createAccount failed to establish a session`)
  }

  const fetchingGates = tryFetchGates(account.did, 'prefer-fresh-gates')

  if (!account.deactivated) {
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

  await configureModerationForAccount(agent, account)

  return {
    agent,
    account,
    fetchingGates,
  }
}

import {BskyAgent} from '@atproto/api'

import {tryFetchGates} from '#/lib/statsig/statsig'
import {configureModerationForAccount} from './moderation'
import {SessionAccount, SessionApiContext} from './types'
import {isSessionDeactivated} from './util'
import {IS_PROD_SERVICE} from '#/lib/constants'
import {DEFAULT_PROD_FEEDS} from '../queries/preferences'

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
  birthDate,
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

  // Not awaited so that we can still get into onboarding.
  // This is OK because we won't let you toggle adult stuff until you set the date.
  agent.setPersonalDetails({birthDate: birthDate.toISOString()})
  if (IS_PROD_SERVICE(service)) {
    agent.setSavedFeeds(DEFAULT_PROD_FEEDS.saved, DEFAULT_PROD_FEEDS.pinned)
  }

  await configureModerationForAccount(agent, account)

  return {
    agent,
    account,
    fetchingGates,
  }
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

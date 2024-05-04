import {BskyAgent} from '@atproto/api'
import {AtpSessionEvent} from '@atproto-labs/api'

import {networkRetry} from '#/lib/async/retry'
import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {tryFetchGates} from '#/lib/statsig/statsig'
import {
  configureModerationForAccount,
  configureModerationForGuest,
} from './moderation'
import {SessionAccount} from './types'
import {isSessionDeactivated, isSessionExpired} from './util'
import {IS_PROD_SERVICE} from '#/lib/constants'
import {DEFAULT_PROD_FEEDS} from '../queries/preferences'

export function createPublicAgent() {
  configureModerationForGuest() // Side effect but only relevant for tests
  return new BskyAgent({service: PUBLIC_BSKY_SERVICE})
}

export async function createAgentAndResume(
  {
    storedAccount,
  }: {
    storedAccount: SessionAccount
  },
  onAgentSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const fetchingGates = tryFetchGates(storedAccount.did, 'prefer-low-latency')
  const agent = new BskyAgent({service: storedAccount.service})
  if (storedAccount.pdsUrl) {
    agent.pdsUrl = agent.api.xrpc.uri = new URL(storedAccount.pdsUrl)
  }

  await configureModerationForAccount(agent, storedAccount)

  agent.setPersistSessionHandler(event => {
    onAgentSessionChange(agent, storedAccount.did, event)
  })

  const prevSession = {
    accessJwt: storedAccount.accessJwt ?? '',
    refreshJwt: storedAccount.refreshJwt ?? '',
    did: storedAccount.did,
    handle: storedAccount.handle,
  }
  if (isSessionExpired(storedAccount)) {
    await networkRetry(1, () => agent.resumeSession(prevSession))
    const account = agentToSessionAccount(agent)
    if (!agent.session || !account) {
      throw new Error(`session: login failed to establish a session`)
    }

    await fetchingGates
    return {agent, account}
  } else {
    agent.session = prevSession
    if (!storedAccount.deactivated) {
      // Intentionally not awaited to unblock the UI:
      networkRetry(1, () => agent.resumeSession(prevSession))
    }

    await fetchingGates
    return {agent, account: storedAccount}
  }
}

export async function createAgentAndLogin(
  {
    service,
    identifier,
    password,
    authFactorToken,
  }: {
    service: string
    identifier: string
    password: string
    authFactorToken?: string
  },
  onAgentSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const agent = new BskyAgent({service})
  await agent.login({identifier, password, authFactorToken})

  const account = agentToSessionAccount(agent)
  if (!agent.session || !account) {
    throw new Error(`session: login failed to establish a session`)
  }

  const fetchingGates = tryFetchGates(account.did, 'prefer-fresh-gates')
  await configureModerationForAccount(agent, account)

  agent.setPersistSessionHandler(event => {
    onAgentSessionChange(agent, account.did, event)
  })

  await fetchingGates
  return {
    agent,
    account,
  }
}

export async function createAgentAndCreateAccount(
  {
    service,
    email,
    password,
    handle,
    birthDate,
    inviteCode,
    verificationPhone,
    verificationCode,
  }: {
    service: string
    email: string
    password: string
    handle: string
    birthDate: Date
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  },
  onAgentSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
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
  await fetchingGates

  agent.setPersistSessionHandler(event => {
    onAgentSessionChange(agent, account.did, event)
  })

  await fetchingGates
  return {
    agent,
    account,
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

import {
  AtpSessionData,
  AtpSessionEvent,
  BskyAgent,
  SessionDispatcher,
} from '@atproto/api'

import {networkRetry} from '#/lib/async/retry'
import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {IS_PROD_SERVICE} from '#/lib/constants'
import {tryFetchGates} from '#/lib/statsig/statsig'
import {DEFAULT_PROD_FEEDS} from '../queries/preferences'
import {
  configureModerationForAccount,
  configureModerationForGuest,
} from './moderation'
import {SessionAccount} from './types'
import {isSessionDeactivated, isSessionExpired} from './util'

export function createPublicAgent() {
  configureModerationForGuest() // Side effect but only relevant for tests
  return new BskyAgent({service: PUBLIC_BSKY_SERVICE})
}

export async function createAgentAndResume(
  storedAccount: SessionAccount,
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const dispatcher = new SessionDispatcher({service: storedAccount.service})
  const agent = new BskyAgent(dispatcher)
  if (storedAccount.pdsUrl) {
    dispatcher.pdsUrl = new URL(storedAccount.pdsUrl)
  }
  const gates = tryFetchGates(storedAccount.did, 'prefer-low-latency')
  const moderation = configureModerationForAccount(agent, storedAccount)
  const prevSession: AtpSessionData = {
    // Sorted in the same property order as when returned by BskyAgent (alphabetical).
    accessJwt: storedAccount.accessJwt ?? '',
    did: storedAccount.did,
    email: storedAccount.email,
    emailAuthFactor: storedAccount.emailAuthFactor,
    emailConfirmed: storedAccount.emailConfirmed,
    handle: storedAccount.handle,
    refreshJwt: storedAccount.refreshJwt ?? '',
  }
  if (isSessionExpired(storedAccount)) {
    await networkRetry(1, () => dispatcher.resumeSession(prevSession))
  } else {
    dispatcher.session = prevSession
    if (!storedAccount.deactivated) {
      // Intentionally not awaited to unblock the UI:
      networkRetry(1, () => dispatcher.resumeSession(prevSession))
    }
  }

  return prepareAgent(dispatcher, agent, gates, moderation, onSessionChange)
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
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const dispatcher = new SessionDispatcher({service})
  await dispatcher.login({identifier, password, authFactorToken})

  const agent = new BskyAgent(dispatcher)

  const account = dispatcherToSessionAccountOrThrow(dispatcher)
  const gates = tryFetchGates(account.did, 'prefer-fresh-gates')
  const moderation = configureModerationForAccount(agent, account)
  return prepareAgent(dispatcher, agent, moderation, gates, onSessionChange)
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
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const dispatcher = new SessionDispatcher({service})
  await dispatcher.createAccount({
    email,
    password,
    handle,
    inviteCode,
    verificationPhone,
    verificationCode,
  })

  const agent = new BskyAgent(dispatcher)

  const account = dispatcherToSessionAccountOrThrow(dispatcher)
  const gates = tryFetchGates(account.did, 'prefer-fresh-gates')
  const moderation = configureModerationForAccount(agent, account)
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

  return prepareAgent(dispatcher, agent, gates, moderation, onSessionChange)
}

async function prepareAgent(
  dispatcher: SessionDispatcher,
  agent: BskyAgent,
  // Not awaited in the calling code so we can delay blocking on them.
  gates: Promise<void>,
  moderation: Promise<void>,
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  // There's nothing else left to do, so block on them here.
  await Promise.all([gates, moderation])

  // Now the agent is ready.
  const account = dispatcherToSessionAccountOrThrow(dispatcher)
  dispatcher.setPersistSessionHandler(event => {
    onSessionChange(agent, account.did, event)
  })
  return {agent, account}
}

export function dispatcherToSessionAccountOrThrow(
  dispatcher: SessionDispatcher,
): SessionAccount {
  const account = dispatcherToSessionAccount(dispatcher)
  if (!account) {
    throw Error('Expected an active session')
  }
  return account
}

export function dispatcherToSessionAccount(
  dispatcher: SessionDispatcher,
): SessionAccount | undefined {
  if (!dispatcher.session) {
    return undefined
  }
  return {
    service: dispatcher.serviceUrl.toString(),
    did: dispatcher.session.did,
    handle: dispatcher.session.handle,
    email: dispatcher.session.email,
    emailConfirmed: dispatcher.session.emailConfirmed || false,
    emailAuthFactor: dispatcher.session.emailAuthFactor || false,
    refreshJwt: dispatcher.session.refreshJwt,
    accessJwt: dispatcher.session.accessJwt,
    deactivated: isSessionDeactivated(dispatcher.session.accessJwt),
    pdsUrl: dispatcher.pdsUrl?.toString(),
  }
}

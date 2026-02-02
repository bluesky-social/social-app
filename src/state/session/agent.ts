import {
  Agent as BaseAgent,
  type AppBskyActorProfile,
  type AtprotoServiceType,
  type AtpSessionData,
  type AtpSessionEvent,
  BskyAgent,
  type Did,
  type Un$Typed,
} from '@atproto/api'
import {type FetchHandler} from '@atproto/api/dist/agent'
import {type SessionManager} from '@atproto/api/dist/session-manager'
import {TID} from '@atproto/common-web'
import {type FetchHandlerOptions} from '@atproto/xrpc'

import {networkRetry} from '#/lib/async/retry'
import {
  BLUESKY_PROXY_HEADER,
  BSKY_SERVICE,
  DISCOVER_SAVED_FEED,
  IS_PROD_SERVICE,
  PUBLIC_BSKY_SERVICE,
  TIMELINE_SAVED_FEED,
} from '#/lib/constants'
import {getAge} from '#/lib/strings/time'
import {logger} from '#/logger'
import {snoozeBirthdateUpdateAllowedForDid} from '#/state/birthdate'
import {snoozeEmailConfirmationPrompt} from '#/state/shell/reminders'
import {
  prefetchAgeAssuranceData,
  setBirthdateForDid,
  setCreatedAtForDid,
} from '#/ageAssurance/data'
import {features} from '#/analytics'
import {emitNetworkConfirmed, emitNetworkLost} from '../events'
import {addSessionErrorLog} from './logging'
import {
  configureModerationForAccount,
  configureModerationForGuest,
} from './moderation'
import {type SessionAccount} from './types'
import {isSessionExpired, isSignupQueued} from './util'

export type ProxyHeaderValue = `${Did}#${AtprotoServiceType}`

export function createPublicAgent() {
  configureModerationForGuest() // Side effect but only relevant for tests

  const agent = new BskyAppAgent({service: PUBLIC_BSKY_SERVICE})
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  return agent
}

export async function createAgentAndResume(
  storedAccount: SessionAccount,
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const agent = new BskyAppAgent({service: storedAccount.service})
  if (storedAccount.pdsUrl) {
    agent.sessionManager.pdsUrl = new URL(storedAccount.pdsUrl)
  }
  const gates = features.refresh({
    strategy: 'prefer-low-latency',
  })
  const moderation = configureModerationForAccount(agent, storedAccount)
  const prevSession: AtpSessionData = sessionAccountToSession(storedAccount)
  if (isSessionExpired(storedAccount)) {
    await networkRetry(1, () => agent.resumeSession(prevSession))
  } else {
    agent.sessionManager.session = prevSession
    if (!storedAccount.signupQueued) {
      networkRetry(3, () => agent.resumeSession(prevSession)).catch(
        (e: any) => {
          logger.error(`networkRetry failed to resume session`, {
            status: e?.status || 'unknown',
            // this field name is ignored by Sentry scrubbers
            safeMessage: e?.message || 'unknown',
          })

          throw e
        },
      )
    }
  }

  // after session is attached
  const aa = prefetchAgeAssuranceData({agent})

  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  return agent.prepare({
    resolvers: [gates, moderation, aa],
    onSessionChange,
  })
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
  const agent = new BskyAppAgent({service})
  await agent.login({
    identifier,
    password,
    authFactorToken,
    allowTakendown: true,
  })

  const account = agentToSessionAccountOrThrow(agent)
  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  const moderation = configureModerationForAccount(agent, account)
  const aa = prefetchAgeAssuranceData({agent})

  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  return agent.prepare({
    resolvers: [gates, moderation, aa],
    onSessionChange,
  })
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
  const agent = new BskyAppAgent({service})
  await agent.createAccount({
    email,
    password,
    handle,
    inviteCode,
    verificationPhone,
    verificationCode,
  })
  const account = agentToSessionAccountOrThrow(agent)
  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  const moderation = configureModerationForAccount(agent, account)

  const createdAt = new Date().toISOString()
  const birthdate = birthDate.toISOString()

  /*
   * Since we have a race with account creation, profile creation, and AA
   * state, set these values locally to ensure sync reads. Values are written
   * to the server in the next step, so on subsequent reloads, the server will
   * be the source of truth.
   */
  setCreatedAtForDid({did: account.did, createdAt})
  setBirthdateForDid({did: account.did, birthdate})
  snoozeBirthdateUpdateAllowedForDid(account.did)
  // do this last
  const aa = prefetchAgeAssuranceData({agent})

  // Not awaited so that we can still get into onboarding.
  // This is OK because we won't let you toggle adult stuff until you set the date.
  if (IS_PROD_SERVICE(service)) {
    Promise.allSettled(
      [
        networkRetry(3, () => {
          return agent.setPersonalDetails({
            birthDate: birthdate,
          })
        }).catch(e => {
          logger.info(`createAgentAndCreateAccount: failed to set birthDate`)
          throw e
        }),
        networkRetry(3, () => {
          return agent.upsertProfile(prev => {
            const next: Un$Typed<AppBskyActorProfile.Record> = prev || {}
            next.displayName = handle
            next.createdAt = createdAt
            return next
          })
        }).catch(e => {
          logger.info(
            `createAgentAndCreateAccount: failed to set initial profile`,
          )
          throw e
        }),
        networkRetry(1, () => {
          return agent.overwriteSavedFeeds([
            {
              ...DISCOVER_SAVED_FEED,
              id: TID.nextStr(),
            },
            {
              ...TIMELINE_SAVED_FEED,
              id: TID.nextStr(),
            },
          ])
        }).catch(e => {
          logger.info(
            `createAgentAndCreateAccount: failed to set initial feeds`,
          )
          throw e
        }),
        getAge(birthDate) < 18 &&
          networkRetry(3, () => {
            return agent.com.atproto.repo.putRecord({
              repo: account.did,
              collection: 'chat.bsky.actor.declaration',
              rkey: 'self',
              record: {
                $type: 'chat.bsky.actor.declaration',
                allowIncoming: 'none',
              },
            })
          }).catch(e => {
            logger.info(
              `createAgentAndCreateAccount: failed to set chat declaration`,
            )
            throw e
          }),
      ].filter(Boolean),
    ).then(promises => {
      const rejected = promises.filter(p => p.status === 'rejected')
      if (rejected.length > 0) {
        logger.error(
          `session: createAgentAndCreateAccount failed to save personal details and feeds`,
        )
      }
    })
  } else {
    Promise.allSettled(
      [
        networkRetry(3, () => {
          return agent.setPersonalDetails({
            birthDate: birthDate.toISOString(),
          })
        }).catch(e => {
          logger.info(`createAgentAndCreateAccount: failed to set birthDate`)
          throw e
        }),
        networkRetry(3, () => {
          return agent.upsertProfile(prev => {
            const next: Un$Typed<AppBskyActorProfile.Record> = prev || {}
            next.createdAt = prev?.createdAt || new Date().toISOString()
            return next
          })
        }).catch(e => {
          logger.info(
            `createAgentAndCreateAccount: failed to set initial profile`,
          )
          throw e
        }),
      ].filter(Boolean),
    ).then(promises => {
      const rejected = promises.filter(p => p.status === 'rejected')
      if (rejected.length > 0) {
        logger.error(
          `session: createAgentAndCreateAccount failed to save personal details and feeds`,
        )
      }
    })
  }

  try {
    // snooze first prompt after signup, defer to next prompt
    snoozeEmailConfirmationPrompt()
  } catch (e: any) {
    logger.error(e, {message: `session: failed snoozeEmailConfirmationPrompt`})
  }

  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  return agent.prepare({
    resolvers: [gates, moderation, aa],
    onSessionChange,
  })
}

export function agentToSessionAccountOrThrow(agent: BskyAgent): SessionAccount {
  const account = agentToSessionAccount(agent)
  if (!account) {
    throw Error('Expected an active session')
  }
  return account
}

export function agentToSessionAccount(
  agent: BskyAgent,
): SessionAccount | undefined {
  if (!agent.session) {
    return undefined
  }
  return {
    service: agent.serviceUrl.toString(),
    did: agent.session.did,
    handle: agent.session.handle,
    email: agent.session.email,
    emailConfirmed: agent.session.emailConfirmed || false,
    emailAuthFactor: agent.session.emailAuthFactor || false,
    refreshJwt: agent.session.refreshJwt,
    accessJwt: agent.session.accessJwt,
    signupQueued: isSignupQueued(agent.session.accessJwt),
    active: agent.session.active,
    status: agent.session.status,
    pdsUrl: agent.pdsUrl?.toString(),
    isSelfHosted: !agent.serviceUrl.toString().startsWith(BSKY_SERVICE),
  }
}

export function sessionAccountToSession(
  account: SessionAccount,
): AtpSessionData {
  return {
    // Sorted in the same property order as when returned by BskyAgent (alphabetical).
    accessJwt: account.accessJwt ?? '',
    did: account.did,
    email: account.email,
    emailAuthFactor: account.emailAuthFactor,
    emailConfirmed: account.emailConfirmed,
    handle: account.handle,
    refreshJwt: account.refreshJwt ?? '',
    /**
     * @see https://github.com/bluesky-social/atproto/blob/c5d36d5ba2a2c2a5c4f366a5621c06a5608e361e/packages/api/src/agent.ts#L188
     */
    active: account.active ?? true,
    status: account.status,
  }
}

export class Agent extends BaseAgent {
  constructor(
    proxyHeader: ProxyHeaderValue | null,
    options: SessionManager | FetchHandler | FetchHandlerOptions,
  ) {
    super(options)
    if (proxyHeader) {
      this.configureProxy(proxyHeader)
    }
  }
}

// Not exported. Use factories above to create it.
// WARN: In the factories above, we _manually set a proxy header_ for the agent after we do whatever it is we are supposed to do.
// Ideally, we wouldn't be doing this. However, since there is so much logic that requires making calls to the PDS right now, it
// feels safer to just let those run as-is and set the header afterward.
let realFetch = globalThis.fetch
class BskyAppAgent extends BskyAgent {
  persistSessionHandler: ((event: AtpSessionEvent) => void) | undefined =
    undefined

  constructor({service}: {service: string}) {
    super({
      service,
      async fetch(...args) {
        let success = false
        try {
          const result = await realFetch(...args)
          success = true
          return result
        } catch (e) {
          success = false
          throw e
        } finally {
          if (success) {
            emitNetworkConfirmed()
          } else {
            emitNetworkLost()
          }
        }
      },
      persistSession: (event: AtpSessionEvent) => {
        if (this.persistSessionHandler) {
          this.persistSessionHandler(event)
        }
      },
    })
  }

  async prepare({
    resolvers,
    onSessionChange,
  }: {
    // Not awaited in the calling code so we can delay blocking on them.
    resolvers: Promise<unknown>[]
    onSessionChange: (
      agent: BskyAgent,
      did: string,
      event: AtpSessionEvent,
    ) => void
  }) {
    // There's nothing else left to do, so block on them here.
    await Promise.all(resolvers)

    // Now the agent is ready.
    const account = agentToSessionAccountOrThrow(this)
    this.persistSessionHandler = event => {
      onSessionChange(this, account.did, event)
      if (event !== 'create' && event !== 'update') {
        addSessionErrorLog(account.did, event)
      }
    }
    return {account, agent: this}
  }

  dispose() {
    this.sessionManager.session = undefined
    this.persistSessionHandler = undefined
  }
}

export type {BskyAppAgent}

import {Agent} from '@atproto/api'
import {type OutputSchema} from '@atproto/api/dist/client/types/com/atproto/server/getSession'
import {type OAuthSession} from '@atproto/oauth-client-browser'

import {BSKY_SERVICE} from '#/lib/constants'
import {tryFetchGates} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {configureModerationForAccount} from './moderation'
import {BSKY_OAUTH_CLIENT} from './oauth-web-client'
import {type SessionAccount} from './types'

export async function oauthCreateAgent(session: OAuthSession) {
  const agent = new OauthBskyAppAgent(session)
  const gates = tryFetchGates(session.did, 'prefer-fresh-gates')
  const moderation = configureModerationForAccount(agent, session)
  return agent.prepare(gates, moderation)
}

export async function oauthResumeSession(account: SessionAccount) {
  const session = await BSKY_OAUTH_CLIENT.restore(account.did)
  return await oauthCreateAgent(session)
}

export async function oauthAgentAndSessionToSessionAccountOrThrow(
  agent: Agent,
  session: OAuthSession,
): Promise<SessionAccount> {
  const account = await oauthAgentAndSessionToSessionAccount(agent, session)
  if (!account) {
    throw Error('Expected an active session')
  }
  return account
}

export async function oauthAgentAndSessionToSessionAccount(
  agent: Agent,
  session: OAuthSession,
): Promise<SessionAccount | undefined> {
  let data: OutputSchema
  try {
    const res = await agent.com.atproto.server.getSession()
    data = res.data
  } catch (e: any) {
    logger.error(e)
    return undefined
  }
  return {
    service: session.serverMetadata.issuer,
    did: session.did,
    handle: data.handle,
    email: data.email,
    emailConfirmed: data.emailConfirmed,
    emailAuthFactor: data.emailAuthFactor,
    active: data.active,
    status: data.status,
    pdsUrl: session.serverMetadata.issuer,
    isSelfHosted: !session.server.issuer.startsWith(BSKY_SERVICE), // TODO: is this entryway?
  }
}

export class OauthBskyAppAgent extends Agent {
  #session: OAuthSession
  #account?: SessionAccount

  constructor(session: OAuthSession) {
    super(session)

    this.#session = session
  }

  async prepare(gates: Promise<void>, moderation: Promise<void>) {
    // we have to await account fetching, since we need a separate call to getSession. this doesn't get returned in the
    // OAuthSession itself, unlike the old agent
    const account = await oauthAgentAndSessionToSessionAccountOrThrow(
      this,
      this.#session,
    )
    this.#account = account

    await Promise.all([gates, moderation])

    return {account, agent: this}
  }

  // does nothing, but aligning with BskyAppAgent
  dispose() {}
}

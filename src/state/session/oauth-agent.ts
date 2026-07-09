/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Agent,
  type AtpSessionData,
  ComAtprotoServerGetSession,
} from '@atproto/api'
import {type OAuthSession} from '@atproto/oauth-client'

import {BLUESKY_PROXY_HEADER, BSKY_SERVICE} from '#/lib/constants'
import {logger} from '#/logger'
import {
  sessionAccountToSession,
  stripAppviewProxyForPdsLocalMethods,
} from './agent'
import {configureModerationForAccount} from './moderation'
import {getOAuthClient} from './oauth-client'
import {type SessionAccount} from './types'

export async function oauthCreateAgent(session: OAuthSession) {
  const agent = new OauthBskyAppAgent(session)
  const account = await oauthAgentAndSessionToSessionAccountOrThrow(
    agent,
    session,
  )
  const gates = Promise.resolve()
  const moderation = configureModerationForAccount(agent, account)
  return agent.prepare(account, gates, moderation)
}

const OAUTH_RESTORE_TIMEOUT_MS = 10_000

export async function oauthResumeSession(account: SessionAccount) {
  const client = getOAuthClient()
  let session: OAuthSession
  try {
    session = await Promise.race([
      client.restore(account.did),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('OAuth session restore timed out')),
          OAUTH_RESTORE_TIMEOUT_MS,
        ),
      ),
    ])
  } catch (e) {
    logger.error('oauthResumeSession: restore failed', {
      did: account.did,
      error: e instanceof Error ? e.message : String(e),
    })
    throw e
  }
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
  let data: ComAtprotoServerGetSession.OutputSchema
  try {
    const res = await Promise.race([
      agent.com.atproto.server.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('getSession timed out')),
          OAUTH_RESTORE_TIMEOUT_MS,
        ),
      ),
    ])
    data = res.data
  } catch (e: any) {
    logger.error('oauthAgentAndSessionToSessionAccount: getSession failed', e)
    return undefined
  }
  let aud: string
  try {
    const tokenInfo = await Promise.race([
      session.getTokenInfo(false),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('getTokenInfo timed out')),
          OAUTH_RESTORE_TIMEOUT_MS,
        ),
      ),
    ])
    aud = tokenInfo.aud
  } catch (e: any) {
    logger.error('oauthAgentAndSessionToSessionAccount: getTokenInfo failed', e)
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
    pdsUrl: aud,
    isSelfHosted: !session.server.issuer.startsWith(BSKY_SERVICE),
    isOauthSession: true,
  }
}

export class OauthBskyAppAgent extends Agent {
  session?: AtpSessionData
  dispatchUrl?: string

  constructor(session: OAuthSession) {
    // Wrap the OAuth session's fetchHandler so the appview proxy header is
    // stripped from PDS-local methods. The header is added by the Agent's XRPC
    // wrapper before it calls the session manager, so stripping here removes it
    // from the outbound request. See stripAppviewProxyForPdsLocalMethods.
    super({
      get did() {
        return session.did
      },
      fetchHandler(url, init) {
        return session.fetchHandler(
          url,
          stripAppviewProxyForPdsLocalMethods(url, init) ?? init,
        )
      },
    })
  }

  async prepare(
    account: SessionAccount,
    gates: Promise<void>,
    moderation: Promise<void>,
  ) {
    this.session = sessionAccountToSession(account)
    this.dispatchUrl = account.pdsUrl
    this.configureProxy(BLUESKY_PROXY_HEADER.get())

    await Promise.all([gates, moderation])

    return {account, agent: this}
  }

  dispose() {}
}

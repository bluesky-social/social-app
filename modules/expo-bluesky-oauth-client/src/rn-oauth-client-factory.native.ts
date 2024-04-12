import {Fetch} from '@atproto/fetch'
import {UniversalIdentityResolver} from '@atproto/identity-resolver'
import {
  OAuthAuthorizeOptions,
  OAuthClientFactory,
  OAuthResponseMode,
  OAuthResponseType,
  Session,
} from '@atproto/oauth-client'
import {OAuthClientMetadata} from '@atproto/oauth-client-metadata'
import {IsomorphicOAuthServerMetadataResolver} from '@atproto/oauth-server-metadata-resolver'

import {CryptoSubtle} from './crypto-subtle'
import {DatabaseStore, RNOAuthDatabase} from './rn-oauth-database'

export type RNOAuthClientOptions = {
  responseMode?: OAuthResponseMode
  responseType?: OAuthResponseType
  clientMetadata: OAuthClientMetadata
  fetch?: Fetch
  crypto?: Crypto
}

const POPUP_KEY_PREFIX = '@@oauth-popup-callback:'

export class RNOAuthClientFactory extends OAuthClientFactory {
  readonly sessionStore: DatabaseStore<Session>

  constructor({
    clientMetadata,
    // "fragment" is safer as it is not sent to the server
    responseMode = 'fragment',
    responseType,
    crypto,
    fetch = globalThis.fetch,
  }: RNOAuthClientOptions) {
    const database = new RNOAuthDatabase()

    super({
      clientMetadata,
      responseMode,
      responseType,
      fetch,
      cryptoImplementation: new CryptoSubtle(),
      sessionStore: database.getSessionStore(),
      stateStore: database.getStateStore(),
      metadataResolver: new IsomorphicOAuthServerMetadataResolver({
        fetch,
        cache: database.getMetadataCache(),
      }),
      identityResolver: UniversalIdentityResolver.from({
        fetch,
        didCache: database.getDidCache(),
        handleCache: database.getHandleCache(),
        plcDirectoryUrl: 'http://localhost:2582', // dev-env
        atprotoLexiconUrl: 'http://localhost:2584', // dev-env (bsky appview)
      }),
      dpopNonceCache: database.getDpopNonceCache(),
    })

    this.sessionStore = database.getSessionStore()
  }

  async restoreAll() {
    const sessionIds = await this.sessionStore.getKeys()
    return Object.fromEntries(
      await Promise.all(
        sessionIds.map(
          async sessionId =>
            [sessionId, await this.restore(sessionId, false)] as const,
        ),
      ),
    )
  }

  async init(sessionId?: string, forceRefresh = false) {
    const signInResult = await this.signInCallback()
    if (signInResult) {
      return signInResult
    } else if (sessionId) {
      const client = await this.restore(sessionId, forceRefresh)
      return {client}
    } else {
      // TODO: we could restore any session from the store ?
    }
  }

  async signIn(input: string, options?: OAuthAuthorizeOptions) {
    return await this.authorize(input, options)
  }

  async signInCallback() {
    const redirectUri = new URL(this.clientMetadata.redirect_uris[0])
    if (location.pathname !== redirectUri.pathname) return null

    const params =
      this.responseMode === 'query'
        ? new URLSearchParams(location.search)
        : new URLSearchParams(location.hash.slice(1))

    // Only if the query string contains oauth callback params
    if (
      !params.has('iss') ||
      !params.has('state') ||
      !(params.has('code') || params.has('error'))
    ) {
      return null
    }

    // Replace the current history entry without the query string (this will
    // prevent this 'if' branch to run again if the user refreshes the page)
    history.replaceState(null, '', location.pathname)

    return this.callback(params)
      .then(async result => {
        if (result.state?.startsWith(POPUP_KEY_PREFIX)) {
          const stateKey = result.state.slice(POPUP_KEY_PREFIX.length)

          await this.popupStore.set(stateKey, {
            status: 'fulfilled',
            value: result.client.sessionId,
          })

          window.close() // continued in signInPopup
          throw new Error('Login complete, please close the popup window.')
        }

        return result
      })
      .catch(async err => {
        // TODO: Throw a proper error from parent class to actually detect
        // oauth authorization errors
        const state = typeof (err as any)?.state
        if (typeof state === 'string' && state?.startsWith(POPUP_KEY_PREFIX)) {
          const stateKey = state.slice(POPUP_KEY_PREFIX.length)

          await this.popupStore.set(stateKey, {
            status: 'rejected',
            reason: err,
          })

          window.close() // continued in signInPopup
          throw new Error('Login complete, please close the popup window.')
        }

        throw err
      })
  }
}

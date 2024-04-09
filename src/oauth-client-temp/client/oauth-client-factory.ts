import {GenericStore} from '@atproto/caching'

import {Key} from '#/oauth-client-temp/jwk'
import {FALLBACK_ALG} from './constants'
import {OAuthCallbackError} from './oauth-callback-error'
import {OAuthClient} from './oauth-client'
import {OAuthServer} from './oauth-server'
import {
  OAuthServerFactory,
  OAuthServerFactoryOptions,
} from './oauth-server-factory'
import {
  OAuthAuthorizeOptions,
  OAuthResponseMode,
  OAuthResponseType,
} from './oauth-types'
import {Session, SessionGetter} from './session-getter'

export type InternalStateData = {
  iss: string
  nonce: string
  dpopKey: Key
  verifier?: string

  /**
   * @note This could be parametrized to be of any type. This wasn't done for
   * the sake of simplicity but could be added in a later development.
   */
  appState?: string
}

export type OAuthClientOptions = OAuthServerFactoryOptions & {
  stateStore: GenericStore<string, InternalStateData>
  sessionStore: GenericStore<string, Session>

  /**
   * "form_post" will typically be used for server-side applications.
   */
  responseMode?: OAuthResponseMode
  responseType?: OAuthResponseType
}

export class OAuthClientFactory {
  readonly serverFactory: OAuthServerFactory

  readonly stateStore: GenericStore<string, InternalStateData>
  readonly sessionGetter: SessionGetter

  readonly responseMode?: OAuthResponseMode
  readonly responseType?: OAuthResponseType

  constructor(options: OAuthClientOptions) {
    this.responseMode = options?.responseMode
    this.responseType = options?.responseType
    this.serverFactory = new OAuthServerFactory(options)
    this.stateStore = options.stateStore
    this.sessionGetter = new SessionGetter(
      options.sessionStore,
      this.serverFactory,
    )
  }

  get clientMetadata() {
    return this.serverFactory.clientMetadata
  }

  async authorize(
    input: string,
    options?: OAuthAuthorizeOptions,
  ): Promise<URL> {
    const {did, metadata} = await this.serverFactory.resolver.resolve(input)

    const nonce = await this.serverFactory.crypto.generateNonce()
    const pkce = await this.serverFactory.crypto.generatePKCE()
    const dpopKey = await this.serverFactory.crypto.generateKey(
      metadata.dpop_signing_alg_values_supported || [FALLBACK_ALG],
    )

    const state = await this.serverFactory.crypto.generateNonce()

    await this.stateStore.set(state, {
      iss: metadata.issuer,
      dpopKey,
      nonce,
      verifier: pkce?.verifier,
      appState: options?.state,
    })

    const parameters = {
      client_id: this.clientMetadata.client_id,
      redirect_uri: this.clientMetadata.redirect_uris[0],
      code_challenge: pkce?.challenge,
      code_challenge_method: pkce?.method,
      nonce,
      state,
      login_hint: did || undefined,
      response_mode: this.responseMode,
      response_type:
        this.responseType != null &&
        metadata.response_types_supported?.includes(this.responseType)
          ? this.responseType
          : 'code',

      display: options?.display,
      id_token_hint: options?.id_token_hint,
      max_age: options?.max_age, // this.clientMetadata.default_max_age
      prompt: options?.prompt,
      scope: options?.scope
        ?.split(' ')
        .filter(s => metadata.scopes_supported?.includes(s))
        .join(' '),
      ui_locales: options?.ui_locales,
    }

    if (metadata.pushed_authorization_request_endpoint) {
      const server = await this.serverFactory.fromMetadata(metadata, dpopKey)
      const {json} = await server.request(
        'pushed_authorization_request',
        parameters,
      )

      const authorizationUrl = new URL(metadata.authorization_endpoint)
      authorizationUrl.searchParams.set(
        'client_id',
        this.clientMetadata.client_id,
      )
      authorizationUrl.searchParams.set('request_uri', json.request_uri)
      return authorizationUrl
    } else if (metadata.require_pushed_authorization_requests) {
      throw new Error(
        'Server requires pushed authorization requests (PAR) but no PAR endpoint is available',
      )
    } else {
      const authorizationUrl = new URL(metadata.authorization_endpoint)
      for (const [key, value] of Object.entries(parameters)) {
        if (value) authorizationUrl.searchParams.set(key, String(value))
      }

      // Length of the URL that will be sent to the server
      const urlLength =
        authorizationUrl.pathname.length + authorizationUrl.search.length
      if (urlLength < 2048) {
        return authorizationUrl
      } else if (!metadata.pushed_authorization_request_endpoint) {
        throw new Error('Login URL too long')
      }
    }

    throw new Error(
      'Server does not support pushed authorization requests (PAR)',
    )
  }

  async callback(params: URLSearchParams): Promise<{
    client: OAuthClient
    state?: string
  }> {
    // TODO: better errors

    const responseJwt = params.get('response')
    if (responseJwt != null) {
      // https://openid.net/specs/oauth-v2-jarm.html
      throw new OAuthCallbackError(params, 'JARM not supported')
    }

    const issuerParam = params.get('iss')
    const stateParam = params.get('state')
    const errorParam = params.get('error')
    const codeParam = params.get('code')

    if (!stateParam) {
      throw new OAuthCallbackError(params, 'Missing "state" parameter')
    }
    const stateData = await this.stateStore.get(stateParam)
    if (stateData) {
      // Prevent any kind of replay
      await this.stateStore.del(stateParam)
    } else {
      throw new OAuthCallbackError(params, 'Invalid state')
    }

    try {
      if (errorParam != null) {
        throw new OAuthCallbackError(params, undefined, stateData.appState)
      }

      if (!codeParam) {
        throw new OAuthCallbackError(
          params,
          'Missing "code" query param',
          stateData.appState,
        )
      }

      const server = await this.serverFactory.fromIssuer(
        stateData.iss,
        stateData.dpopKey,
      )

      if (issuerParam != null) {
        if (!server.serverMetadata.issuer) {
          throw new OAuthCallbackError(
            params,
            'Issuer not found in metadata',
            stateData.appState,
          )
        }
        if (server.serverMetadata.issuer !== issuerParam) {
          throw new OAuthCallbackError(
            params,
            'Issuer mismatch',
            stateData.appState,
          )
        }
      } else if (
        server.serverMetadata.authorization_response_iss_parameter_supported
      ) {
        throw new OAuthCallbackError(
          params,
          'iss missing from the response',
          stateData.appState,
        )
      }

      const tokenSet = await server.exchangeCode(codeParam, stateData.verifier)
      try {
        if (tokenSet.id_token) {
          await this.serverFactory.crypto.validateIdTokenClaims(
            tokenSet.id_token,
            stateParam,
            stateData.nonce,
            codeParam,
            tokenSet.access_token,
          )
        }

        const sessionId = await this.serverFactory.crypto.generateNonce(4)

        await this.sessionGetter.setStored(sessionId, {
          dpopKey: stateData.dpopKey,
          tokenSet,
        })

        const client = this.createClient(server, sessionId)

        return {client, state: stateData.appState}
      } catch (err) {
        await server.revoke(tokenSet.access_token)

        throw err
      }
    } catch (err) {
      // Make sure, whatever the underlying error, that the appState is
      // available in the calling code
      throw OAuthCallbackError.from(err, params, stateData.appState)
    }
  }

  /**
   * Build a client from a stored session. This will refresh the token only if
   * needed (about to expire) by default.
   *
   * @param refresh See {@link SessionGetter.getSession}
   */
  async restore(sessionId: string, refresh?: boolean): Promise<OAuthClient> {
    const {dpopKey, tokenSet} = await this.sessionGetter.getSession(
      sessionId,
      refresh,
    )

    const server = await this.serverFactory.fromIssuer(tokenSet.iss, dpopKey)

    return this.createClient(server, sessionId)
  }

  async revoke(sessionId: string) {
    const {dpopKey, tokenSet} = await this.sessionGetter.get(sessionId, {
      allowStale: true,
    })

    const server = await this.serverFactory.fromIssuer(tokenSet.iss, dpopKey)

    await server.revoke(tokenSet.access_token)
    await this.sessionGetter.delStored(sessionId)
  }

  createClient(server: OAuthServer, sessionId: string): OAuthClient {
    return new OAuthClient(server, sessionId, this.sessionGetter)
  }
}

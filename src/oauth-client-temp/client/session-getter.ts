import {CachedGetter, GenericStore} from '@atproto/caching'
import {FetchResponseError} from '@atproto/fetch'

import {Key} from '#/oauth-client-temp/jwk'
import {TokenSet} from './oauth-server'
import {OAuthServerFactory} from './oauth-server-factory'

export type Session = {
  dpopKey: Key
  tokenSet: TokenSet
}

/**
 * There are several advantages to wrapping the sessionStore in a (single)
 * CachedGetter, the main of which is that the cached getter will ensure that at
 * most one fresh call is ever being made. Another advantage, is that it
 * contains the logic for reading from the cache which, if the cache is based on
 * localStorage/indexedDB, will sync across multiple tabs (for a given
 * sessionId).
 */
export class SessionGetter extends CachedGetter<string, Session> {
  constructor(
    sessionStore: GenericStore<string, Session>,
    serverFactory: OAuthServerFactory,
  ) {
    super(
      async (sessionId, options, storedSession) => {
        // There needs to be a previous session to be able to refresh
        if (storedSession === undefined) {
          throw new Error('The session was revoked')
        }

        // Since refresh tokens can only be used once, we might run into
        // concurrency issues if multiple tabs/instances are trying to refresh
        // the same token. The chances of this happening when multiple instances
        // are started simultaneously is reduced by randomizing the expiry time
        // (see isStale() bellow). Even so, There still exist chances that
        // multiple tabs will try to refresh the token at the same time. The
        // best solution would be to use a mutex/lock to ensure that only one
        // instance is refreshing the token at a time. A simpler workaround is
        // to check if the value stored in the session store is the same as the
        // one in memory. If it isn't, then another instance has already
        // refreshed the token.

        const {tokenSet, dpopKey} = storedSession
        const server = await serverFactory.fromIssuer(tokenSet.iss, dpopKey)
        const newTokenSet = await server.refresh(tokenSet).catch(async err => {
          if (await isRefreshDeniedError(err)) {
            // Allow some time for the concurrent request to be stored before
            // we try to get it.
            await new Promise(r => setTimeout(r, 500))

            const stored = await this.getStored(sessionId)
            if (stored !== undefined) {
              if (
                stored.tokenSet.access_token !== tokenSet.access_token ||
                stored.tokenSet.refresh_token !== tokenSet.refresh_token
              ) {
                // A concurrent refresh occurred. Pretend this one succeeded.
                return stored.tokenSet
              } else {
                // The session data will be deleted from the sessionStore by
                // the "deleteOnError" callback.
              }
            }
          }

          throw err
        })
        return {...storedSession, tokenSet: newTokenSet}
      },
      sessionStore,
      {
        isStale: (sessionId, {tokenSet}) => {
          return (
            tokenSet.expires_at != null &&
            tokenSet.expires_at <
              Date.now() +
                // Add some lee way to ensure the token is not expired when it
                // reaches the server.
                30e3 +
                // Add some randomness to prevent all instances from trying to
                // refreshing at the exact same time, when they are started at
                // the same time.
                60e3 * Math.random()
          )
        },
        onStoreError: async (err, sessionId, {tokenSet, dpopKey}) => {
          // If the token data cannot be stored, let's revoke it
          const server = await serverFactory.fromIssuer(tokenSet.iss, dpopKey)
          await server.revoke(tokenSet.access_token)
          throw err
        },
        deleteOnError: async (err, sessionId, {tokenSet}) => {
          // Not possible to refresh without a refresh token
          if (!tokenSet.refresh_token) return true

          // If fetching a refresh token fails because they are no longer valid,
          // delete the session from the sessionStore.
          if (await isRefreshDeniedError(err)) return true

          // Unknown cause, keep the session in the store
          return false
        },
      },
    )
  }

  /**
   * @param refresh When `true`, the credentials will be refreshed even if they
   * are not expired. When `false`, the credentials will not be refreshed even
   * if they are expired. When `undefined`, the credentials will be refreshed
   * if, and only if, they are (about to be) expired. Defaults to `undefined`.
   */
  async getSession(sessionId: string, refresh?: boolean) {
    return this.get(sessionId, {
      noCache: refresh === true,
      allowStale: refresh === false,
    })
  }
}

async function isRefreshDeniedError(err: unknown) {
  if (err instanceof FetchResponseError && err.statusCode === 400) {
    if (err.response?.bodyUsed === false) {
      try {
        const json = await err.response.clone().json()
        return (
          json.error === 'invalid_request' &&
          json.error_description === 'Invalid refresh token'
        )
      } catch {
        // falls through
      }
    }
  }

  return false
}

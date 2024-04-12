import React from 'react'
import * as Browser from 'expo-web-browser'

import {
  DPOP_BOUND_ACCESS_TOKENS,
  OAUTH_APPLICATION_TYPE,
  OAUTH_CLIENT_ID,
  OAUTH_GRANT_TYPES,
  OAUTH_REDIRECT_URI,
  OAUTH_RESPONSE_TYPES,
  OAUTH_SCOPE,
} from 'lib/oauth'
import {RNOAuthClientFactory} from '../../../../modules/expo-bluesky-oauth-client'

// Service URL here is just a placeholder, this isn't how it will actually work
export function useLogin() {
  const openAuthSession = React.useCallback(async () => {
    const oauthFactory = new RNOAuthClientFactory({
      clientMetadata: {
        client_id: OAUTH_CLIENT_ID,
        redirect_uris: [OAUTH_REDIRECT_URI],
        grant_types: OAUTH_GRANT_TYPES,
        response_types: OAUTH_RESPONSE_TYPES,
        scope: OAUTH_SCOPE,
        dpop_bound_access_tokens: DPOP_BOUND_ACCESS_TOKENS,
        application_type: OAUTH_APPLICATION_TYPE,
      },
      fetch: global.fetch,
    })

    const url = await oauthFactory.signIn('http://localhost:2583/')

    console.log(url.href)

    const authSession = await Browser.openAuthSessionAsync(
      url.href,
      OAUTH_REDIRECT_URI,
    )

    if (authSession.type !== 'success') {
      return
    }
  }, [])

  return {
    openAuthSession,
  }
}

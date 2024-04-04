import React from 'react'
import * as Browser from 'expo-web-browser'

import {buildOAuthUrl, OAUTH_REDIRECT_URI} from 'lib/oauth'

// TODO remove hack
const serviceUrl = 'http://localhost:2583/oauth/authorize'

// Service URL here is just a placeholder, this isn't how it will actually work
export function useLogin(serviceUrl: string | undefined) {
  const openAuthSession = React.useCallback(async () => {
    if (!serviceUrl) return

    const url = buildOAuthUrl(serviceUrl, '123') // TODO replace '123' with the appropriate state

    const authSession = await Browser.openAuthSessionAsync(
      url, // This isn't actually how this will work
      OAUTH_REDIRECT_URI, // Replace this as well with the appropriate link
    )

    if (authSession.type !== 'success') {
      return
    }
  }, [serviceUrl])

  return {
    openAuthSession,
  }
}

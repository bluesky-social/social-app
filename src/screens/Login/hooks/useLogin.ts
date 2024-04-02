import React from 'react'
import * as Browser from 'expo-web-browser'

// Service URL here is just a placeholder, this isn't how it will actually work
export function useLogin(serviceUrl: string | undefined) {
  const openAuthSession = React.useCallback(async () => {
    if (!serviceUrl) return

    const authSession = await Browser.openAuthSessionAsync(
      serviceUrl, // This isn't actually how this will work
      'bsky://login', // Replace this as well with the appropriate link
      {
        windowFeatures: {},
      },
    )

    if (authSession.type !== 'success') {
      return
    }
  }, [serviceUrl])

  return {
    openAuthSession,
  }
}

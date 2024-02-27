import React from 'react'
import * as Linking from 'expo-linking'
import {useComposerControls} from 'state/shell'
import {useSession} from 'state/session'
import {onComposeIntent} from 'lib/intents/compose'
import {isNative} from 'platform/detection'

type IntentType = 'compose'

export function useIntentHandler() {
  const incomingUrl = Linking.useURL()
  const {hasSession} = useSession()
  const {openComposer} = useComposerControls()

  React.useEffect(() => {
    const handleIncomingURL = (url: string) => {
      const urlp = new URL(url)
      const [_, intentTypeNative, intentTypeWeb] = urlp.pathname.split('/')

      // On native, our links look like bluesky://intent/SomeIntent, so we have to check the hostname for the
      // intent check. On web, we have to check the first part of the path since we have an actual hostname
      const intentType = isNative ? intentTypeNative : intentTypeWeb
      const isIntent = isNative
        ? urlp.hostname === 'intent'
        : intentTypeNative === 'intent'
      const params = urlp.searchParams

      if (!isIntent) return

      switch (intentType as IntentType) {
        case 'compose': {
          onComposeIntent({
            text: params.get('text'),
            imageUris: params.get('imageUris'),
            openComposer,
            hasSession,
          })
        }
      }
    }

    if (incomingUrl) handleIncomingURL(incomingUrl)
  }, [hasSession, openComposer, incomingUrl])
}

import React from 'react'
import * as Linking from 'expo-linking'
import {isNative} from 'platform/detection'
import {useComposerControls} from 'state/shell'
import {useSession} from 'state/session'

type IntentType = 'compose'

export function useIntentHandler() {
  const incomingUrl = Linking.useURL()
  const composeIntent = useComposeIntent()

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
          composeIntent({
            text: params.get('text'),
            imageUris: params.get('imageUris'),
          })
        }
      }
    }

    if (incomingUrl) handleIncomingURL(incomingUrl)
  }, [incomingUrl, composeIntent])
}

function useComposeIntent() {
  const {openComposer} = useComposerControls()
  const {hasSession} = useSession()

  return React.useCallback(
    ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      text,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      imageUris,
    }: {
      text: string | null
      imageUris: string | null // unused for right now, will be used later with intents
    }) => {
      if (!hasSession) return

      setTimeout(() => {
        openComposer({}) // will pass in values to the composer here in the share extension
      }, 500)
    },
    [openComposer, hasSession],
  )
}

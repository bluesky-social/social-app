import React from 'react'
import * as Linking from 'expo-linking'
import {isNative} from 'platform/detection'
import {useComposerControls} from 'state/shell'
import {useSession} from 'state/session'

type IntentType = 'compose'

const VALID_IMAGE_REGEX = /^[\w.:\-_/]+\|\d+(\.\d+)?\|\d+(\.\d+)?$/

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
            imageUrisStr: params.get('imageUris'),
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
      text,
      imageUrisStr,
    }: {
      text: string | null
      imageUrisStr: string | null // unused for right now, will be used later with intents
    }) => {
      if (!hasSession) return

      const imageUris = imageUrisStr
        ?.split(',')
        .filter(part => {
          // For some security, we're going to filter out any image uri that is external. We don't want someone to
          // be able to provide some link like "bluesky://intent/compose?imageUris=https://IHaveYourIpNow.com/image.jpeg
          // and we load that image
          if (part.includes('https://') || part.includes('http://')) {
            return false
          }
          // We also should just filter out cases that don't have all the info we need
          if (!VALID_IMAGE_REGEX.test(part)) {
            return false
          }
          return true
        })
        .map(part => {
          const [uri, width, height] = part.split('|')
          return {uri, width: Number(width), height: Number(height)}
        })

      setTimeout(() => {
        openComposer({
          text: text ?? undefined,
          imageUris: isNative ? imageUris : undefined,
        })
      }, 500)
    },
    [openComposer, hasSession],
  )
}

import React from 'react'
import {Alert} from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {parseLinkingUrl} from '#/lib/parseLinkingUrl'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {useCloseAllActiveElements} from '#/state/util'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import {IS_IOS, IS_NATIVE} from '#/env'
import {Referrer} from '../../../modules/expo-bluesky-swiss-army'
import {useApplyPullRequestOTAUpdate} from './useOTAUpdates'

type IntentType = 'compose' | 'verify-email' | 'age-assurance' | 'apply-ota'

const VALID_IMAGE_REGEX = /^[\w.:\-_/]+\|\d+(\.\d+)?\|\d+(\.\d+)?$/

// This needs to stay outside of react to persist between account switches
let previousIntentUrl = ''

export function useIntentHandler() {
  const incomingUrl = Linking.useLinkingURL()
  const composeIntent = useComposeIntent()
  const verifyEmailIntent = useVerifyEmailIntent()
  const {currentAccount} = useSession()
  const {tryApplyUpdate} = useApplyPullRequestOTAUpdate()

  React.useEffect(() => {
    const handleIncomingURL = async (url: string) => {
      if (IS_IOS) {
        // Close in-app browser if it's open (iOS only)
        await WebBrowser.dismissBrowser().catch(() => {})
      }

      const referrerInfo = Referrer.getReferrerInfo()
      if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
        logger.metric('deepLink:referrerReceived', {
          to: url,
          referrer: referrerInfo?.referrer,
          hostname: referrerInfo?.hostname,
        })
      }
      const urlp = parseLinkingUrl(url)
      const [, intent, intentType] = urlp.pathname.split('/')

      // On native, our links look like bluesky://intent/SomeIntent, so we have to check the hostname for the
      // intent check. On web, we have to check the first part of the path since we have an actual hostname
      const isIntent = intent === 'intent'
      const params = urlp.searchParams

      if (!isIntent) return

      switch (intentType as IntentType) {
        case 'compose': {
          composeIntent({
            text: params.get('text'),
            imageUrisStr: params.get('imageUris'),
            videoUri: params.get('videoUri'),
          })
          return
        }
        case 'verify-email': {
          const code = params.get('code')
          if (!code) return
          verifyEmailIntent(code)
          return
        }
        case 'age-assurance': {
          // Handled in `#/ageAssurance/components/RedirectOverlay.tsx`
          return
        }
        case 'apply-ota': {
          const channel = params.get('channel')
          if (!channel) {
            Alert.alert('Error', 'No channel provided to look for.')
          } else {
            tryApplyUpdate(channel)
          }
          return
        }
        default: {
          return
        }
      }
    }

    if (incomingUrl) {
      if (previousIntentUrl === incomingUrl) {
        return
      }
      handleIncomingURL(incomingUrl)
      previousIntentUrl = incomingUrl
    }
  }, [
    incomingUrl,
    composeIntent,
    verifyEmailIntent,
    currentAccount,
    tryApplyUpdate,
  ])
}

export function useComposeIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {openComposer} = useOpenComposer()
  const {hasSession} = useSession()

  return React.useCallback(
    ({
      text,
      imageUrisStr,
      videoUri,
    }: {
      text: string | null
      imageUrisStr: string | null
      videoUri: string | null
    }) => {
      if (!hasSession) return
      closeAllActiveElements()

      // Whenever a video URI is present, we don't support adding images right now.
      if (videoUri) {
        const [uri, width, height] = videoUri.split('|')
        openComposer({
          text: text ?? undefined,
          videoUri: {uri, width: Number(width), height: Number(height)},
        })
        return
      }

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
          return VALID_IMAGE_REGEX.test(part)
        })
        .map(part => {
          const [uri, width, height] = part.split('|')
          return {uri, width: Number(width), height: Number(height)}
        })

      setTimeout(() => {
        openComposer({
          text: text ?? undefined,
          imageUris: IS_NATIVE ? imageUris : undefined,
        })
      }, 500)
    },
    [hasSession, closeAllActiveElements, openComposer],
  )
}

function useVerifyEmailIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {verifyEmailDialogControl: control, setVerifyEmailState: setState} =
    useIntentDialogs()
  return React.useCallback(
    (code: string) => {
      closeAllActiveElements()
      setState({
        code,
      })
      setTimeout(() => {
        control.open()
      }, 1000)
    },
    [closeAllActiveElements, control, setState],
  )
}

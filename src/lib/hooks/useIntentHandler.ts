import React from 'react'
import {Alert} from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {logger} from '#/logger'
import {isIOS, isNative} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useCloseAllActiveElements} from '#/state/util'
import {
  parseAgeAssuranceRedirectDialogState,
  useAgeAssuranceRedirectDialogControl,
} from '#/components/ageAssurance/AgeAssuranceRedirectDialog'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
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
  const ageAssuranceRedirectDialogControl =
    useAgeAssuranceRedirectDialogControl()
  const {currentAccount} = useSession()
  const {tryApplyUpdate} = useApplyPullRequestOTAUpdate()

  React.useEffect(() => {
    const handleIncomingURL = async (url: string) => {
      if (isIOS) {
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

      // We want to be able to support bluesky:// deeplinks. It's unnatural for someone to use a deeplink with three
      // slashes, like bluesky:///intent/follow. However, supporting just two slashes causes us to have to take care
      // of two cases when parsing the url. If we ensure there is a third slash, we can always ensure the first
      // path parameter is in pathname rather than in hostname.
      if (url.startsWith('bluesky://') && !url.startsWith('bluesky:///')) {
        url = url.replace('bluesky://', 'bluesky:///')
      }

      const urlp = new URL(url)
      const [__, intent, intentType] = urlp.pathname.split('/')

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
          const state = parseAgeAssuranceRedirectDialogState({
            result: params.get('result') ?? undefined,
            actorDid: params.get('actorDid') ?? undefined,
          })

          /*
           * If we don't have an account or the account doesn't match, do
           * nothing. By the time the user switches to their other account, AA
           * state should be ready for them.
           */
          if (
            state &&
            currentAccount &&
            state.actorDid === currentAccount.did
          ) {
            ageAssuranceRedirectDialogControl.open(state)
          }
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
    ageAssuranceRedirectDialogControl,
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
          imageUris: isNative ? imageUris : undefined,
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

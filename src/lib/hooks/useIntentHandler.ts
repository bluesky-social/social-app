import {useCallback, useEffect} from 'react'
import {Alert} from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import {Referrer} from '@bsky.app/expo-bluesky-swiss-army'
import {useLingui} from '@lingui/react/macro'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {parseLinkingUrl} from '#/lib/parseLinkingUrl'
import {CHAT_INVITE_CODE_REGEX, parsePostAtUri} from '#/lib/strings/url-helpers'
import {usePrefetchJoinLinkPreviews} from '#/state/queries/join-links'
import {useGetPost} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {useSetActiveLanding} from '#/state/shell/landing'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import * as Toast from '#/components/Toast'
import {getTrendingTopicFeedUri} from '#/components/TrendingTopics'
import {useAnalytics} from '#/analytics'
import {IS_IOS, IS_NATIVE} from '#/env'
import {
  parseWidgetExploreClick,
  parseWidgetTopicClick,
} from '#/features/trendingWidget/links'
import {type app} from '#/lexicons'
import {useApplyPullRequestOTAUpdate} from './useOTAUpdates'

type IntentType = 'compose' | 'verify-email' | 'age-assurance' | 'apply-ota'

const VALID_IMAGE_REGEX = /^[\w.:\-_/]+\|\d+(\.\d+)?\|\d+(\.\d+)?$/

// This needs to stay outside of react to persist between account switches
let previousIntentUrl = ''

export function useIntentHandler() {
  const incomingUrl = Linking.useLinkingURL()
  const ax = useAnalytics()
  const composeIntent = useComposeIntent()
  const verifyEmailIntent = useVerifyEmailIntent()
  const groupChatJoinIntent = useGroupChatJoinIntent()
  const {currentAccount} = useSession()
  const {tryApplyUpdate} = useApplyPullRequestOTAUpdate()

  useEffect(() => {
    const handleIncomingURL = async (url: string) => {
      if (IS_IOS) {
        // Close in-app browser if it's open (iOS only)
        await WebBrowser.dismissBrowser().catch(() => {})
      }

      const referrerInfo = await Referrer.getReferrerInfo()
      if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
        ax.metric('deepLink:referrerReceived', {
          to: url,
          referrer: referrerInfo?.referrer,
          hostname: referrerInfo?.hostname,
        })
      }
      const urlp = parseLinkingUrl(url)
      const widgetTopicClick = parseWidgetTopicClick(urlp)
      if (widgetTopicClick) {
        ax.metric('trendingTopic:click', {
          context: 'widget',
          feedUri: getTrendingTopicFeedUri({link: widgetTopicClick.path}),
          rank: widgetTopicClick.rank,
          recId: widgetTopicClick.recId,
        })
      }
      const widgetExploreClick = parseWidgetExploreClick(urlp)
      if (widgetExploreClick) {
        ax.metric('trendingWidget:explore:click', widgetExploreClick)
      }
      const chatInviteMatch = urlp.pathname.match(CHAT_INVITE_CODE_REGEX)
      if (chatInviteMatch) {
        groupChatJoinIntent(chatInviteMatch[1], url)
        return
      }
      const [, intent, intentType] = urlp.pathname.split('/')

      // On native, our links look like bluesky://intent/SomeIntent, so we have to check the hostname for the
      // intent check. On web, we have to check the first part of the path since we have an actual hostname
      const isIntent = intent === 'intent'
      const params = urlp.searchParams

      if (!isIntent) return

      switch (intentType as IntentType) {
        case 'compose': {
          void composeIntent({
            text: params.get('text'),
            imageUrisStr: params.get('imageUris'),
            videoUri: params.get('videoUri'),
            atUri: params.get('at-uri'),
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
          const releaseVersion = params.get('releaseVersion')
          const buildNumber = params.get(
            IS_IOS ? 'iosBuildNumber' : 'androidBuildNumber',
          )
          const appVersion =
            releaseVersion && buildNumber
              ? `${releaseVersion}.${buildNumber}`
              : null
          if (!channel) {
            Alert.alert('Error', 'No channel provided to look for.')
            return
          }
          tryApplyUpdate(channel, appVersion)
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
      handleIncomingURL(incomingUrl).finally(() => {
        /*
         * expo-linking caches the URL that launched the app and replays it to
         * every new `useLinkingURL`/`getLinkingURL` caller, so an account
         * switch (which remounts the tree, see `key={currentAccount?.did}` in
         * `App.native.tsx`) or a runtime reload would hand us the same link
         * again. Drop it now that it's been handled - this hook is the last
         * consumer of the launch URL, everything else reads it while
         * rendering, before this effect runs. No-op on web.
         */
        Linking.clearInitialURL()
      })
      previousIntentUrl = incomingUrl
    }
  }, [
    incomingUrl,
    ax,
    composeIntent,
    verifyEmailIntent,
    groupChatJoinIntent,
    currentAccount,
    tryApplyUpdate,
  ])
}

export function useComposeIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {openComposer} = useOpenComposer()
  const {hasSession} = useSession()
  const getPost = useGetPost()
  const {t: l} = useLingui()

  return useCallback(
    async ({
      text,
      imageUrisStr,
      videoUri,
      atUri,
    }: {
      text: string | null
      imageUrisStr: string | null
      videoUri: string | null
      /** A post to quote, from apps sharing a post into Bluesky. */
      atUri?: string | null
    }) => {
      if (!hasSession) return
      closeAllActiveElements()

      /*
       * The quote button checks these before opening the composer, and a link
       * skips that button. When the post can't be quoted, still open the
       * composer so the person keeps any text that came with the link.
       */
      const getQuote = async (
        uri: string,
      ): Promise<app.bsky.feed.defs.PostView | undefined> => {
        let post: app.bsky.feed.defs.PostView
        try {
          post = await getPost({uri})
        } catch {
          Toast.show(l`Couldn’t load the post to quote`, {type: 'error'})
          return
        }
        if (post.viewer?.embeddingDisabled) {
          Toast.show(l`This post's author has disabled quote posts.`, {
            type: 'warning',
          })
          return
        }
        const author = post.author.viewer
        if (author?.blocking || author?.blockedBy || author?.blockingByList) {
          Toast.show(l`Cannot interact with a blocked user`, {
            type: 'warning',
          })
          return
        }
        return post
      }
      // Anything that isn't a post at-uri is ignored
      const quoteUri = parsePostAtUri(atUri)
      const quote = quoteUri ? await getQuote(quoteUri) : undefined

      // Whenever a video URI is present, we don't support adding images right now.
      if (videoUri) {
        const [uri, width, height] = videoUri.split('|')
        openComposer({
          text: text ?? undefined,
          videoUri: {uri, width: Number(width), height: Number(height)},
          quote,
          logContext: 'Deeplink',
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
          quote,
          logContext: 'Deeplink',
        })
      }, 500)
    },
    [hasSession, closeAllActiveElements, openComposer, getPost, l],
  )
}

export function useGroupChatJoinIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {hasSession} = useSession()
  const {groupChatJoinDialogControl: control, setGroupChatJoinState: setState} =
    useIntentDialogs()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const setActiveLanding = useSetActiveLanding()
  const prefetchJoinLinkPreviews = usePrefetchJoinLinkPreviews()
  return useCallback(
    (code: string, uri?: string) => {
      closeAllActiveElements()
      if (hasSession) {
        setState({code})
        const prefetch = prefetchJoinLinkPreviews({
          codes: [code],
          hasSession: true,
        })
        void Promise.race([
          prefetch,
          new Promise(res => setTimeout(res, 200)),
        ]).finally(() => {
          control.open()
        })
      } else {
        setActiveLanding({type: 'groupchat', uri: uri ?? '', code})
        requestSwitchToAccount({requestedAccount: 'groupchat'})
      }
    },
    [
      closeAllActiveElements,
      hasSession,
      control,
      setState,
      prefetchJoinLinkPreviews,
      requestSwitchToAccount,
      setActiveLanding,
    ],
  )
}

function useVerifyEmailIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {verifyEmailDialogControl: control, setVerifyEmailState: setState} =
    useIntentDialogs()
  return useCallback(
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

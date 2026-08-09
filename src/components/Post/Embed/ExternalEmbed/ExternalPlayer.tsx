import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  ActivityIndicator,
  type GestureResponderEvent,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  measure,
  useAnimatedRef,
  useFrameCallback,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {WebView} from 'react-native-webview'
import {scheduleOnRN} from 'react-native-worklets'
import {Image} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {
  type EmbedPlayerParams,
  getEmbedPlayerMediaType,
  getPlayerAspect,
} from '#/lib/strings/embed-player'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {EventStopper} from '#/view/com/util/EventStopper'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {EmbedConsentDialog} from '#/components/dialogs/EmbedConsent'
import {Fill} from '#/components/Fill'
import {KeepAwake} from '#/components/KeepAwake'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'
import {getPlayerVisibility} from './playerVisibility'

interface ShouldStartLoadRequest {
  url: string
}

// This renders the overlay when the player is either inactive or loading as a separate layer
function PlaceholderOverlay({
  isLoading,
  isPlayerActive,
  onPress,
}: {
  isLoading: boolean
  isPlayerActive: boolean
  onPress: (event: GestureResponderEvent) => void
}) {
  const {_} = useLingui()

  // If the player is active and not loading, we don't want to show the overlay.
  if (isPlayerActive && !isLoading) return null

  return (
    <View style={[a.absolute, a.inset_0, {zIndex: 2}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Play Video`)}
        accessibilityHint={_(msg`Plays the video`)}
        onPress={onPress}
        style={[a.flex_1, a.justify_center, a.align_center]}>
        {!isPlayerActive ? (
          <PlayButtonIcon />
        ) : (
          <ActivityIndicator size="large" color="white" />
        )}
      </Pressable>
    </View>
  )
}

// This renders the webview/youtube player as a separate layer
function Player({
  params,
  onLoad,
  isPlayerActive,
  onFullscreenChange,
}: {
  isPlayerActive: boolean
  params: EmbedPlayerParams
  onLoad: () => void
  onFullscreenChange: (isFullscreen: boolean) => void
}) {
  // ensures we only load what's requested
  // when it's a youtube video, we need to allow both bsky.app and youtube.com
  const onShouldStartLoadWithRequest = useCallback(
    (event: ShouldStartLoadRequest) =>
      event.url === params.playerUri ||
      (params.source.startsWith('youtube') &&
        event.url.includes('www.youtube.com')),
    [params.playerUri, params.source],
  )

  // Don't show the player until it is active
  if (!isPlayerActive) return null

  return (
    <>
      <EventStopper style={[a.absolute, a.inset_0, {zIndex: 3}]}>
        <WebView
          javaScriptEnabled={true}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          bounces={false}
          allowsFullscreenVideo
          nestedScrollEnabled
          source={{uri: params.playerUri}}
          onLoad={onLoad}
          onFullscreenChange={event =>
            onFullscreenChange(event.nativeEvent.isFullscreen)
          }
          style={a.bg_transparent}
          setSupportMultipleWindows={false} // Prevent any redirects from opening a new window (ads)
        />
      </EventStopper>
      <KeepAwake />
    </>
  )
}

// This renders the player area and handles the logic for when to show the player and when to show the overlay
export function ExternalPlayer({
  link,
  params,
  post,
}: {
  link: app.bsky.embed.external.ViewExternal
  params: EmbedPlayerParams
  post?: app.bsky.feed.defs.PostView
}) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const insets = useSafeAreaInsets()
  const windowDims = useWindowDimensions()
  const externalEmbedsPrefs = useExternalEmbedsPrefs()
  const consentDialogControl = useDialogControl()
  const ax = useAnalytics()

  const [isPlayerActive, setIsPlayerActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  /**
   * Whether the web content is in native fullscreen. Android only - the event
   * that drives it has no iOS counterpart, so this stays `false` there.
   */
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activatePlayer = useCallback(() => {
    if (!isPlayerActive) {
      ax.metric('externalEmbed:playerActivated', {
        postUri: post?.uri,
        postAuthorDid: post?.author.did,
        source: params.source,
        playerType: params.type,
        mediaType: getEmbedPlayerMediaType(params.type),
      })
    }
    setIsPlayerActive(true)
  }, [
    ax,
    isPlayerActive,
    params.source,
    params.type,
    post?.author.did,
    post?.uri,
  ])

  const aspect = useMemo(() => {
    return getPlayerAspect({
      type: params.type,
      width: windowDims.width,
      hasThumb: !!link.thumb,
    })
  }, [params.type, windowDims.width, link.thumb])

  const viewRef = useAnimatedRef()
  const frameCallback = useFrameCallback(() => {
    const measurement = measure(viewRef)
    if (!measurement) return

    const {height: winHeight, width: winWidth} = windowDims

    // Get the proper screen height depending on what is going on
    const realWinHeight = IS_NATIVE // If it is native, we always want the larger number
      ? winHeight > winWidth
        ? winHeight
        : winWidth
      : winHeight // On web, we always want the actual screen height

    const visibility = getPlayerVisibility({
      player: {
        top: measurement.pageY,
        height: measurement.height,
        width: measurement.width,
      },
      window: {width: winWidth, height: realWinHeight},
      insets,
    })

    /*
     * Only `hidden` stops playback. `indeterminate` means we cannot tell yet -
     * most often mid-rotation, where treating it as `hidden` would kill the
     * player the moment the device is turned.
     */
    if (visibility === 'hidden') {
      scheduleOnRN(setIsPlayerActive, false)
    }
  }, false) // False here disables autostarting the callback

  // watch for leaving the viewport due to scrolling
  useEffect(() => {
    // We don't want to do anything if the player isn't active
    if (!isPlayerActive) {
      /*
       * There is no WebView while inactive, so there is no fullscreen to be
       * in. This is cleared here rather than left to the native exit event,
       * which is dropped when the WebView is torn down while still fullscreen
       * - leaving the flag stuck on and the visibility check permanently
       * suspended for the next playback.
       */
      setIsFullscreen(false)
      return
    }

    // Interval for scrolling works in most cases, However, for twitch embeds, if we navigate away from the screen the webview will
    // continue playing. We need to watch for the blur event
    const unsubscribe = navigation.addListener('blur', () => {
      setIsPlayerActive(false)
    })

    /*
     * The frame callback asks where the player sits in the feed. In native
     * fullscreen the content is reparented out of the WebView and into the
     * activity's root view, so the wrapper we measure is an empty placeholder
     * whose position says nothing about what is on screen - and the user
     * cannot scroll anyway. Answering that question regardless is what stops
     * playback when the device is rotated while fullscreen.
     */
    if (!isFullscreen) {
      frameCallback.setActive(true)
    }

    return () => {
      unsubscribe()
      frameCallback.setActive(false)
    }
  }, [navigation, isPlayerActive, isFullscreen, frameCallback])

  const onLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const onPlayPress = useCallback(
    (event: GestureResponderEvent) => {
      // Prevent this from propagating upward on web
      event.preventDefault()

      if (externalEmbedsPrefs?.[params.source] === undefined) {
        consentDialogControl.open()
        return
      }

      activatePlayer()
    },
    [externalEmbedsPrefs, consentDialogControl, params.source, activatePlayer],
  )

  const onAcceptConsent = useCallback(() => {
    activatePlayer()
  }, [activatePlayer])

  return (
    <>
      <EmbedConsentDialog
        control={consentDialogControl}
        source={params.source}
        onAccept={onAcceptConsent}
      />

      <Animated.View
        ref={viewRef}
        collapsable={false}
        style={[aspect, a.overflow_hidden]}>
        {link.thumb && (!isPlayerActive || isLoading) ? (
          <>
            <Image
              style={[a.flex_1]}
              source={{uri: link.thumb}}
              accessibilityIgnoresInvertColors
              loading="lazy"
            />
            <Fill
              style={[
                t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                {opacity: 0.3},
              ]}
            />
          </>
        ) : (
          <Fill
            style={[
              {
                backgroundColor:
                  t.name === 'light' ? t.palette.contrast_975 : 'black',
                opacity: 0.3,
              },
            ]}
          />
        )}
        <PlaceholderOverlay
          isLoading={isLoading}
          isPlayerActive={isPlayerActive}
          onPress={onPlayPress}
        />
        <Player
          isPlayerActive={isPlayerActive}
          params={params}
          onLoad={onLoad}
          onFullscreenChange={setIsFullscreen}
        />
      </Animated.View>
    </>
  )
}

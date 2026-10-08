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
import {type PlayerMode, playerModeAfterFullscreenChange} from './playerMode'
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
            onFullscreenChange(event.nativeEvent.isFullscreen === true)
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

  /**
   * `fullscreen` is Android only - the event that drives it has no iOS
   * counterpart. On iOS the mode never enters `fullscreen`, so the visibility
   * check keeps running.
   */
  const [mode, setMode] = useState<PlayerMode>('inactive')
  const isPlayerActive = mode !== 'inactive'
  const [isLoading, setIsLoading] = useState(true)

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
    setMode(m => (m === 'inactive' ? 'inline' : m))
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

    const visibility = getPlayerVisibility({
      player: {
        top: measurement.pageY,
        height: measurement.height,
        width: measurement.width,
      },
      viewport: windowDims,
      isNative: IS_NATIVE,
      insets,
    })

    // `indeterminate` (e.g. mid-rotation) must not stop playback
    if (visibility === 'hidden') {
      scheduleOnRN(setMode, 'inactive')
    }
  }, false) // False here disables autostarting the callback

  useEffect(() => {
    if (!isPlayerActive) return

    /*
     * Twitch embeds keep playing after navigating away, so stop on blur. Unlike
     * the frame callback this stays subscribed in fullscreen.
     */
    return navigation.addListener('blur', () => {
      setMode('inactive')
    })
  }, [navigation, isPlayerActive])

  /*
   * Not in fullscreen: the content is reparented to the activity root, so the
   * wrapper we would measure is an empty placeholder.
   */
  const isInline = mode === 'inline'
  useEffect(() => {
    // Watch for leaving the viewport due to scrolling
    frameCallback.setActive(isInline)
    return () => frameCallback.setActive(false)
  }, [frameCallback, isInline])

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
          onFullscreenChange={isFullscreen =>
            setMode(m => playerModeAfterFullscreenChange(m, isFullscreen))
          }
        />
      </Animated.View>
    </>
  )
}

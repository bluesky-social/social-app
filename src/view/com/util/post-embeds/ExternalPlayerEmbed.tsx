import React from 'react'
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useFrameCallback,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {WebView} from 'react-native-webview'
import {Image} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {EmbedPlayerParams, getPlayerAspect} from '#/lib/strings/embed-player'
import {isNative} from '#/platform/detection'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {EmbedConsentDialog} from '#/components/dialogs/EmbedConsent'
import {Fill} from '#/components/Fill'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {EventStopper} from '../EventStopper'

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
    <View style={[a.absolute, a.inset_0, styles.overlayLayer]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Play Video`)}
        accessibilityHint={_(msg`Play Video`)}
        onPress={onPress}
        style={[styles.overlayContainer]}>
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
}: {
  isPlayerActive: boolean
  params: EmbedPlayerParams
  onLoad: () => void
}) {
  // ensures we only load what's requested
  // when it's a youtube video, we need to allow both bsky.app and youtube.com
  const onShouldStartLoadWithRequest = React.useCallback(
    (event: ShouldStartLoadRequest) =>
      event.url === params.playerUri ||
      (params.source.startsWith('youtube') &&
        event.url.includes('www.youtube.com')),
    [params.playerUri, params.source],
  )

  // Don't show the player until it is active
  if (!isPlayerActive) return null

  return (
    <EventStopper style={[a.absolute, a.inset_0, styles.playerLayer]}>
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
        style={styles.webview}
        setSupportMultipleWindows={false} // Prevent any redirects from opening a new window (ads)
      />
    </EventStopper>
  )
}

// This renders the player area and handles the logic for when to show the player and when to show the overlay
export function ExternalPlayer({
  link,
  params,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
}) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const insets = useSafeAreaInsets()
  const windowDims = useWindowDimensions()
  const externalEmbedsPrefs = useExternalEmbedsPrefs()
  const consentDialogControl = useDialogControl()

  const [isPlayerActive, setPlayerActive] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  const aspect = React.useMemo(() => {
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
    const realWinHeight = isNative // If it is native, we always want the larger number
      ? winHeight > winWidth
        ? winHeight
        : winWidth
      : winHeight // On web, we always want the actual screen height

    const top = measurement.pageY
    const bot = measurement.pageY + measurement.height

    // We can use the same logic on all platforms against the screenHeight that we get above
    const isVisible = top <= realWinHeight - insets.bottom && bot >= insets.top

    if (!isVisible) {
      runOnJS(setPlayerActive)(false)
    }
  }, false) // False here disables autostarting the callback

  // watch for leaving the viewport due to scrolling
  React.useEffect(() => {
    // We don't want to do anything if the player isn't active
    if (!isPlayerActive) return

    // Interval for scrolling works in most cases, However, for twitch embeds, if we navigate away from the screen the webview will
    // continue playing. We need to watch for the blur event
    const unsubscribe = navigation.addListener('blur', () => {
      setPlayerActive(false)
    })

    // Start watching for changes
    frameCallback.setActive(true)

    return () => {
      unsubscribe()
      frameCallback.setActive(false)
    }
  }, [navigation, isPlayerActive, frameCallback])

  const onLoad = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const onPlayPress = React.useCallback(
    (event: GestureResponderEvent) => {
      // Prevent this from propagating upward on web
      event.preventDefault()

      if (externalEmbedsPrefs?.[params.source] === undefined) {
        consentDialogControl.open()
        return
      }

      setPlayerActive(true)
    },
    [externalEmbedsPrefs, consentDialogControl, params.source],
  )

  const onAcceptConsent = React.useCallback(() => {
    setPlayerActive(true)
  }, [])

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
            />
            <Fill
              style={[
                t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                {
                  opacity: 0.3,
                },
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
        />
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayLayer: {
    zIndex: 2,
  },
  playerLayer: {
    zIndex: 3,
  },
  webview: {
    backgroundColor: 'transparent',
  },
  gifContainer: {
    width: '100%',
    overflow: 'hidden',
  },
})

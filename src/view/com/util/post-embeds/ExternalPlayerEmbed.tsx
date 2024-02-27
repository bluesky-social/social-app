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
import {Image} from 'expo-image'
import {WebView} from 'react-native-webview'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {AppBskyEmbedExternal} from '@atproto/api'
import {EmbedPlayerParams, getPlayerAspect} from 'lib/strings/embed-player'
import {EventStopper} from '../EventStopper'
import {isNative} from 'platform/detection'
import {NavigationProp} from 'lib/routes/types'
import {useExternalEmbedsPrefs} from 'state/preferences'
import {useModalControls} from 'state/modals'

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
    <View style={[styles.layer, styles.overlayLayer]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Play Video`)}
        accessibilityHint={_(msg`Play Video`)}
        onPress={onPress}
        style={[styles.overlayContainer, styles.topRadius]}>
        {!isPlayerActive ? (
          <FontAwesomeIcon icon="play" size={42} color="white" />
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
    <EventStopper style={[styles.layer, styles.playerLayer]}>
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
  const navigation = useNavigation<NavigationProp>()
  const insets = useSafeAreaInsets()
  const windowDims = useWindowDimensions()
  const externalEmbedsPrefs = useExternalEmbedsPrefs()
  const {openModal} = useModalControls()

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
        openModal({
          name: 'embed-consent',
          source: params.source,
          onAccept: () => {
            setPlayerActive(true)
          },
        })
        return
      }

      setPlayerActive(true)
    },
    [externalEmbedsPrefs, openModal, params.source],
  )

  return (
    <Animated.View ref={viewRef} collapsable={false} style={[aspect]}>
      {link.thumb && (!isPlayerActive || isLoading) && (
        <Image
          style={[{flex: 1}, styles.topRadius]}
          source={{uri: link.thumb}}
          accessibilityIgnoresInvertColors
        />
      )}
      <PlaceholderOverlay
        isLoading={isLoading}
        isPlayerActive={isPlayerActive}
        onPress={onPlayPress}
      />
      <Player isPlayerActive={isPlayerActive} params={params} onLoad={onLoad} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  topRadius: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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

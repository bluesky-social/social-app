import React from 'react'
import {
  ActivityIndicator,
  Dimensions,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {Image} from 'expo-image'
import {WebView} from 'react-native-webview'
import YoutubePlayer from 'react-native-youtube-iframe'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {EmbedPlayerParams, getPlayerHeight} from 'lib/strings/embed-player'
import {EventStopper} from '../EventStopper'
import {AppBskyEmbedExternal} from '@atproto/api'
import {isNative} from 'platform/detection'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'

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
  // If the player is active and not loading, we don't want to show the overlay.
  if (isPlayerActive && !isLoading) return null

  return (
    <View style={[styles.layer, styles.overlayLayer]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play Video"
        accessibilityHint=""
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
  height,
  params,
  onLoad,
  isPlayerActive,
}: {
  isPlayerActive: boolean
  params: EmbedPlayerParams
  height: number
  onLoad: () => void
}) {
  // ensures we only load what's requested
  const onShouldStartLoadWithRequest = React.useCallback(
    (event: ShouldStartLoadRequest) => event.url === params.playerUri,
    [params.playerUri],
  )

  // Don't show the player until it is active
  if (!isPlayerActive) return null

  return (
    <View style={[styles.layer, styles.playerLayer]}>
      <EventStopper>
        {isNative && params.type === 'youtube_video' ? (
          <YoutubePlayer
            videoId={params.videoId}
            play
            height={height}
            onReady={onLoad}
            webViewStyle={[styles.webview, styles.topRadius]}
          />
        ) : (
          <View style={{height, width: '100%'}}>
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
              setSupportMultipleWindows={false} // Prevent any redirects from opening a new window (ads)
              style={[styles.webview, styles.topRadius]}
            />
          </View>
        )}
      </EventStopper>
    </View>
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

  const [isPlayerActive, setPlayerActive] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dim, setDim] = React.useState({
    width: 0,
    height: 0,
  })

  const viewRef = React.useRef<View>(null)

  // watch for leaving the viewport due to scrolling
  React.useEffect(() => {
    // Interval for scrolling works in most cases, However, for twitch embeds, if we navigate away from the screen the webview will
    // continue playing. We need to watch for the blur event
    const unsubscribe = navigation.addListener('blur', () => {
      setPlayerActive(false)
    })

    const interval = setInterval(() => {
      viewRef.current?.measure((x, y, w, h, pageX, pageY) => {
        const window = Dimensions.get('window')
        const top = pageY
        const bot = pageY + h
        const isVisible = isNative
          ? top >= 0 && bot <= window.height
          : !(top >= window.height || bot <= 0)
        if (!isVisible) {
          setPlayerActive(false)
        }
      })
    }, 1e3)
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [viewRef, navigation])

  // calculate height for the player and the screen size
  const height = React.useMemo(
    () =>
      getPlayerHeight({
        type: params.type,
        width: dim.width,
        hasThumb: !!link.thumb,
      }),
    [params.type, dim.width, link.thumb],
  )

  const onLoad = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const onPlayPress = React.useCallback((event: GestureResponderEvent) => {
    // Prevent this from propagating upward on web
    event.preventDefault()

    setPlayerActive(true)
  }, [])

  // measure the layout to set sizing
  const onLayout = React.useCallback(
    (event: {nativeEvent: {layout: {width: any; height: any}}}) => {
      setDim({
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.height,
      })
    },
    [],
  )

  return (
    <View
      ref={viewRef}
      style={{height}}
      collapsable={false}
      onLayout={onLayout}>
      {link.thumb && (!isPlayerActive || isLoading) && (
        <Image
          style={[
            {
              width: dim.width,
              height,
            },
            styles.topRadius,
          ]}
          source={{uri: link.thumb}}
          accessibilityIgnoresInvertColors
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
        height={height}
        onLoad={onLoad}
      />
    </View>
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
})

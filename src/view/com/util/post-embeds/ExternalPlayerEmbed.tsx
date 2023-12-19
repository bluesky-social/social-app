import React from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {Image} from 'expo-image'
import {WebView} from 'react-native-webview'
import YoutubePlayer from 'react-native-youtube-iframe'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {EmbedPlayerParams} from 'lib/strings/embed-player'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../text/Text'
import {EventStopper} from '../EventStopper'
import {AppBskyEmbedExternal} from '@atproto/api'
import {isNative} from 'platform/detection'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {Link} from 'view/com/util/Link'

interface ShouldStartLoadRequest {
  url: string
}

// This renders the player and the link
export function ExternalPlayerEmbed({
  link,
  params,
  style,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  return (
    <View style={[styles.extOuter, pal.view, pal.border, style]}>
      <PlayerView link={link} params={params} />
      <Link href={link.uri} style={styles.inner}>
        {!!link.title && (
          <Text type="sm-bold" numberOfLines={2} style={[pal.text]}>
            {link.title}
          </Text>
        )}
        <Text type="sm" numberOfLines={1} style={[pal.textLight, styles.uri]}>
          {link.uri}
        </Text>
        {!!link.description && (
          <Text
            type="sm"
            numberOfLines={2}
            style={[pal.text, styles.description]}>
            {link.description}
          </Text>
        )}
      </Link>
    </View>
  )
}

// This renders the overlay when the player is either inactive or loading as a separate layer
function PlaceholderOverlay({
  link,
  isLoading,
  isPlayerActive,
  onPress,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  isLoading: boolean
  isPlayerActive: boolean
  onPress: () => void
}) {
  // If the player is active and not loading, we don't want to show the overlay.
  if (isPlayerActive && !isLoading) return null

  return (
    <View style={[styles.layer, styles.overlayLayer]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={link.title}
        accessibilityHint=""
        onPress={onPress}
        style={[styles.overlayContainer, styles.topRadius]}>
        {!isPlayerActive ? (
          <FontAwesomeIcon icon="play" size={32} color="white" />
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
function PlayerView({
  link,
  params,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
}) {
  const [isPlayerActive, setPlayerActive] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dim, setDim] = React.useState({
    width: 100,
    height: 100,
  })

  const navigation = useNavigation<NavigationProp>()
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

  const onLoad = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const onPlayPress = React.useCallback(() => {
    setPlayerActive(true)
  }, [])

  // calculate height for the player and the screen size
  const height = React.useMemo(() => {
    if (params.type === 'youtube_video' || params.type === 'twitch_live') {
      return (dim.width / 16) * 9
    }
    if (params.type === 'spotify_song') {
      if (dim.width <= 300) {
        return 180
      }
      return 232
    }
    if (params.type === 'spotify_playlist') {
      return 420
    }
    if (params.type === 'spotify_album') {
      return 420
    }
    return dim.width
  }, [params.type, dim])

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
        link={link}
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
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  inner: {
    padding: 10,
  },
  uri: {
    marginTop: 2,
  },
  description: {
    marginTop: 4,
  },
  topRadius: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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

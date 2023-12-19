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
    <View style={[styles.outer, pal.view, pal.border]}>
      <Player link={link} params={params} />
      <Link href={link.uri}>
        <View style={styles.inner}>
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
        </View>
      </Link>
    </View>
  )
}

function PlaceholderOverlay({
  height,
  width,
  link,
  isLoading,
  isPlayerActive,
  onPress,
}: {
  height: number
  width: number
  link: AppBskyEmbedExternal.ViewExternal
  isLoading: boolean
  isPlayerActive: boolean
  onPress: () => void
}) {
  if (!isLoading && isPlayerActive) return null

  return (
    <View>
      {link.thumb && (
        <Image
          style={{
            width,
            height,
            borderTopRightRadius: 6,
            borderTopLeftRadius: 6,
          }}
          source={{uri: link.thumb}}
          accessibilityIgnoresInvertColors
        />
      )}
      <View
        style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={link.title}
          accessibilityHint=""
          onPress={onPress}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderTopRightRadius: 6,
            borderTopLeftRadius: 6,
          }}>
          {!isPlayerActive ? (
            <FontAwesomeIcon icon="play" size={32} color="white" />
          ) : (
            <ActivityIndicator size="large" />
          )}
        </Pressable>
      </View>
    </View>
  )
}

function Player({
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
  const ref = React.useRef<View>(null)

  // watch for leaving the viewport due to scrolling
  React.useEffect(() => {
    // This works for scrolling. However, for twitch embeds, if we navigate away from the screen the webview will
    // continue playing. We need to watch for the blur event
    const unsubscribe = navigation.addListener('blur', () => {
      setPlayerActive(false)
    })

    const interval = setInterval(() => {
      ref.current?.measure((x, y, w, h, pageX, pageY) => {
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
  }, [ref, navigation])

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
  const onLayout = (event: {
    nativeEvent: {layout: {width: any; height: any}}
  }) => {
    setDim({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })
  }

  // ensures we only load what's requested
  const onShouldStartLoadWithRequest = React.useCallback(
    (event: ShouldStartLoadRequest) => event.url === params.playerUri,
    [params.playerUri],
  )

  return (
    <View ref={ref} style={{height}} collapsable={false} onLayout={onLayout}>
      <PlaceholderOverlay
        height={height}
        width={dim.width}
        link={link}
        isLoading={isLoading}
        isPlayerActive={isPlayerActive}
        onPress={() => setPlayerActive(true)}
      />
      {isPlayerActive && (
        <EventStopper>
          {isNative && params.type === 'youtube_video' ? (
            <YoutubePlayer
              videoId={params.videoId}
              play
              height={height}
              onReady={() => setIsLoading(false)}
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
                onLoad={() => setIsLoading(false)}
                setSupportMultipleWindows={false} // Prevent any redirects from opening a new window (ads)
                style={{
                  backgroundColor: 'transparent',
                }}
              />
            </View>
          )}
        </EventStopper>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
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
})

import React from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleProp,
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
  const [isPlayerActive, setPlayerActive] = React.useState(false)
  const [dim, setDim] = React.useState({
    width: 0,
    height: 0,
  })

  // measure the layout to set sizing
  const onLayout = (event: {
    nativeEvent: {layout: {width: any; height: any}}
  }) => {
    setDim({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })
  }

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

  if (isPlayerActive) {
    return (
      <View style={[{marginTop: 4}, style]} onLayout={onLayout}>
        <EventStopper>
          <Player
            width={dim.width}
            height={height}
            link={link}
            params={params}
            onLeaveViewport={() => setPlayerActive(false)}
          />
        </EventStopper>
      </View>
    )
  }

  return (
    <Pressable
      style={[
        {
          borderRadius: 8,
          marginTop: 4,
        },
        pal.view,
        style,
      ]}
      onPress={() => setPlayerActive(true)}
      accessibilityRole="button"
      accessibilityLabel={link.title}
      accessibilityHint=""
      onLayout={onLayout}>
      <Placeholder
        width={dim.width}
        height={height}
        link={link}
        params={params}
        isLoading={false}
      />
    </Pressable>
  )
}

function Placeholder({
  width,
  height,
  params,
  link,
  isLoading,
}: {
  width: number
  height: number
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
  isLoading: boolean
}) {
  const pal = usePalette('default')

  return (
    <View>
      {link.thumb ? (
        <Image
          style={{width, height, borderRadius: 6}}
          source={{uri: link.thumb}}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={{height: 70, borderRadius: 6, marginTop: 5}} />
      )}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: width === 0 ? '100%' : width,
          backgroundColor: (pal.viewLight.backgroundColor as string) + 'F6',
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
          flexDirection: 'row',
          gap: 10,
          borderRadius: link.thumb != null ? 0 : 6,
        }}>
        <View style={{paddingTop: 6, width: 30}}>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <FontAwesomeIcon
              icon="play"
              size={24}
              color={pal.text.color as string}
            />
          )}
        </View>
        <View style={{flex: 1}}>
          <Text
            type="lg-bold"
            numberOfLines={2}
            style={{color: pal.text.color}}>
            {link.title || link.uri}
          </Text>
          {params.type.startsWith('youtube') && (
            <Text style={{color: pal.text.color}}>YouTube</Text>
          )}
          {params.type.startsWith('twitch') && (
            <Text style={{color: pal.text.color}}>Twitch.tv</Text>
          )}
          {params.type.startsWith('spotify') && (
            <Text style={{color: pal.text.color}}>Spotify</Text>
          )}
        </View>
      </View>
    </View>
  )
}

function Player({
  width,
  height,
  link,
  params,
  onLeaveViewport,
}: {
  width: number
  height: number
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
  onLeaveViewport: () => void
}) {
  const navigation = useNavigation<NavigationProp>()
  const ref = React.useRef<View>(null)
  const [loading, setLoading] = React.useState(true)

  // watch for leaving the viewport due to scrolling
  React.useEffect(() => {
    // This works for scrolling. However, for twitch embeds, if we navigate away from the screen the webview will
    // continue playing. We need to watch for the blur event
    const unsubscribe = navigation.addListener('blur', () => {
      onLeaveViewport()
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
          onLeaveViewport()
        }
      })
    }, 1e3)
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [ref, onLeaveViewport, navigation])

  // ensures we only load what's requested
  const onShouldStartLoadWithRequest = React.useCallback(
    (event: ShouldStartLoadRequest) => event.url === params.playerUri,
    [params.playerUri],
  )

  return (
    <View ref={ref} style={{height}} collapsable={false}>
      {isNative && params.type === 'youtube_video' ? (
        <YoutubePlayer
          videoId={params.videoId}
          play
          height={height}
          onReady={() => setLoading(false)}
        />
      ) : (
        <WebView
          javaScriptEnabled={true}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          bounces={false}
          allowsFullscreenVideo
          source={{uri: params.playerUri}}
          onLoad={() => setLoading(false)}
          setSupportMultipleWindows={false} // Prevent any redirects from opening a new window (ads)
        />
      )}
      {loading && (
        <View style={{position: 'absolute', left: 0, top: 0}}>
          <Placeholder
            width={width}
            height={height}
            params={params}
            link={link}
            isLoading
          />
        </View>
      )}
    </View>
  )
}

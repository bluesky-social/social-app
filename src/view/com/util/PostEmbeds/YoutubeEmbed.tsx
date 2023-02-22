import React, {useEffect} from 'react'
import {useState} from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  EmitterSubscription,
} from 'react-native'
import YoutubePlayer from 'react-native-youtube-iframe'
import {usePalette} from 'lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import ExternalLinkEmbed from './ExternalLinkEmbed'
import {PresentedExternal} from '@atproto/api/dist/client/types/app/bsky/embed/external'
import {useStores} from 'state/index'

const YoutubeEmbed = ({
  link,
  videoId,
}: {
  videoId: string
  link: PresentedExternal
}) => {
  const store = useStores()
  const [displayVideoPlayer, setDisplayVideoPlayer] = useState(false)
  const [playerDimensions, setPlayerDimensions] = useState({
    width: 0,
    height: 0,
  })
  const pal = usePalette('default')
  const handlePlayButtonPressed = () => {
    setDisplayVideoPlayer(true)
  }
  const handleOnLayout = (event: {
    nativeEvent: {layout: {width: any; height: any}}
  }) => {
    setPlayerDimensions({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })
  }
  useEffect(() => {
    let sub: EmitterSubscription
    if (displayVideoPlayer) {
      sub = store.onNavigation(() => {
        setDisplayVideoPlayer(false)
      })
    }
    return () => sub && sub.remove()
  }, [displayVideoPlayer, store])

  const imageChild = (
    <Pressable onPress={handlePlayButtonPressed} style={styles.playButton}>
      <FontAwesomeIcon icon="play" size={24} color="white" />
    </Pressable>
  )

  if (!displayVideoPlayer) {
    return (
      <View
        style={[styles.extOuter, pal.view, pal.border]}
        onLayout={handleOnLayout}>
        <ExternalLinkEmbed
          link={link}
          onImagePress={handlePlayButtonPressed}
          imageChild={imageChild}
        />
      </View>
    )
  }

  const height = (playerDimensions.width / 16) * 9
  const noop = () => {}

  return (
    <TouchableWithoutFeedback onPress={noop}>
      <View>
        {/* Removing the outter View will make tap events propagate to parents */}
        <YoutubePlayer
          initialPlayerParams={{
            modestbranding: true,
          }}
          webViewProps={{
            startInLoadingState: true,
          }}
          height={height}
          videoId={videoId}
          webViewStyle={styles.webView}
        />
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  playButton: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    top: '44%',
    justifyContent: 'center',
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 50,
    opacity: 0.8,
  },
  webView: {
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
})

export default YoutubeEmbed

import {useState} from 'react'
import {View, StyleSheet, Pressable} from 'react-native'
import YoutubePlayer from 'react-native-youtube-iframe'
import {usePalette} from '../../lib/hooks/usePalette'
import {Text} from './text/Text'
import {Image} from './images/Image'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

const YoutubeEmbed = ({videoId, link}: {videoId: string}) => {
  const [displayVideoPlayer, setDisplayVideoPlayer] = useState(false)
  const [playerDimensions, setPlayerDimensions] = useState({
    width: 0,
    height: 0,
  })
  const pal = usePalette('default')
  const handlePlayButtonPressed = () => {
    setDisplayVideoPlayer(true)
  }
  const handleOnLayout = event => {
    setPlayerDimensions({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })
  }

  console.log('videoId', videoId)

  if (!displayVideoPlayer) {
    return (
      <View
        style={[styles.extOuter, pal.view, pal.border]}
        href={link.uri}
        onLayout={setPlayerDimensions}
        noFeedback>
        {link.thumb ? (
          <Image uri={link.thumb} style={styles.extImage} />
        ) : undefined}
        <View style={styles.extInner}>
          <Text type="md-bold" numberOfLines={2} style={[pal.text]}>
            {link.title || link.uri}
          </Text>
          <Text
            type="sm"
            numberOfLines={1}
            style={[pal.textLight, styles.extUri]}>
            {link.uri}
          </Text>
          {link.description ? (
            <Text
              type="sm"
              numberOfLines={2}
              style={[pal.text, styles.extDescription]}>
              {link.description}
            </Text>
          ) : undefined}
        </View>
        <Pressable
          onPress={handlePlayButtonPressed}
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            zIndex: 1,
            backgroundColor: 'black',
            padding: 10,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
            opacity: 0.8,
          }}>
          <FontAwesomeIcon
            icon="play"
            size={24}
            style={pal.link}
            color="white"
          />
        </Pressable>
      </View>
    )
  }

  return (
    <View>
      <YoutubePlayer
        height={200}
        // play={playing}
        videoId={videoId}
        // webViewStyle={{
        //   alignItems: 'center',
        //   // alignSelf: 'center',
        //   alignContent: 'center',
        //   justifyContent: 'center',
        //   backgroundColor: 'red',
        //   borderColor: 'red',
        //   borderWidth: 1,
        // }}
        // onChangeState={onStateChange}
      />
    </View>
  )
}

// TODO: move this out
const styles = StyleSheet.create({
  imagesContainer: {
    marginTop: 4,
  },
  singleImage: {
    borderRadius: 8,
    maxHeight: 500,
  },
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  extInner: {
    padding: 10,
  },
  extImage: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
    maxHeight: 200,
  },
  extUri: {
    marginTop: 2,
  },
  extDescription: {
    marginTop: 4,
  },
})

export default YoutubeEmbed

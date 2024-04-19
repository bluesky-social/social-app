import React, {useRef} from 'react'
import {
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {Image, ImageLoadEventData} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {EmbedPlayerParams, getGifDims} from '#/lib/strings/embed-player'
import {isIOS, isNative, isWeb} from '#/platform/detection'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {useDialogControl} from '#/components/Dialog'
import {EmbedConsentDialog} from '#/components/dialogs/EmbedConsent'
import {VideoPlayer} from '../../../../../modules/expo-bluesky-video-player'

const GIF_LIST = [
  'https://media1.giphy.com/media/duexIlfr9yYwYE23UA/200w.mp4',
  'https://media2.giphy.com/media/p9FB3WC9Xju4o/200w.mp4',
  'https://media2.giphy.com/media/iGAXf0OlUUMYo/200w.mp4',
  'https://media4.giphy.com/media/cFeXVeTKDB0fm/200w.mp4',
  'https://media3.giphy.com/media/qs6ev2pm8g9dS/200w.mp4',
  'https://media2.giphy.com/media/6R2mLi910HL4VXFwOG/200w.mp4',
  'https://media4.giphy.com/media/rOGuft1jgiq66zpQI2/200w.mp4',
]

export function ExternalGifEmbed({
  link,
  params,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
}) {
  const externalEmbedsPrefs = useExternalEmbedsPrefs()

  const {_} = useLingui()
  const consentDialogControl = useDialogControl()

  const thumbHasLoaded = React.useRef(false)
  const viewWidth = React.useRef(0)

  // Tracking if the placer has been activated
  const [isPlayerActive, setIsPlayerActive] = React.useState(false)
  // Tracking whether the gif has been loaded yet
  const [isPrefetched, setIsPrefetched] = React.useState(false)
  // Tracking whether the image is animating
  const [isAnimating, setIsAnimating] = React.useState(true)
  const [imageDims, setImageDims] = React.useState({height: 100, width: 1})

  // Used for controlling animation
  const imageRef = React.useRef<Image>(null)

  const load = React.useCallback(() => {
    setIsPlayerActive(true)
    Image.prefetch(params.playerUri).then(() => {
      // Replace the image once it's fetched
      setIsPrefetched(true)
    })
  }, [params.playerUri])

  const onPlayPress = React.useCallback(
    (event: GestureResponderEvent) => {
      // Don't propagate on web
      event.preventDefault()

      // Show consent if this is the first load
      if (externalEmbedsPrefs?.[params.source] === undefined) {
        consentDialogControl.open()
        return
      }
      // If the player isn't active, we want to activate it and prefetch the gif
      if (!isPlayerActive) {
        load()
        return
      }
      // Control animation on native
      setIsAnimating(prev => {
        if (prev) {
          if (isNative) {
            imageRef.current?.stopAnimating()
          }
          return false
        } else {
          if (isNative) {
            imageRef.current?.startAnimating()
          }
          return true
        }
      })
    },
    [
      consentDialogControl,
      externalEmbedsPrefs,
      isPlayerActive,
      load,
      params.source,
    ],
  )

  const onLoad = React.useCallback((e: ImageLoadEventData) => {
    if (thumbHasLoaded.current) return
    setImageDims(getGifDims(e.source.height, e.source.width, viewWidth.current))
    thumbHasLoaded.current = true
  }, [])

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    viewWidth.current = e.nativeEvent.layout.width
  }, [])

  const onDidLoad = React.useCallback(() => {}, [])

  const rand = React.useMemo(
    () => GIF_LIST[Math.floor(Math.random() * GIF_LIST.length)],
    [],
  )

  const playerRef = useRef()

  return (
    <>
      {/*<EmbedConsentDialog*/}
      {/*  control={consentDialogControl}*/}
      {/*  source={params.source}*/}
      {/*  onAccept={load}*/}
      {/*/>*/}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          playerRef.current.toggleAsync()
        }}>
        <VideoPlayer
          // source="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXJ0ZXk0cmk0b2hmNXhzaGxmbGw4dGE2b2JxNzc4NW13b3Y4MGJrYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1BXa2alBjrCXC/giphy.mp4"
          // source="https://media1.giphy.com/media/duexIlfr9yYwYE23UA/200h.mp4"
          // source="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          source={rand}
          style={{height: 200, width: '100%'}}
          ref={playerRef}
        />
      </Pressable>

      {/*<Pressable*/}
      {/*  style={[*/}
      {/*    {height: imageDims.height},*/}
      {/*    styles.topRadius,*/}
      {/*    styles.gifContainer,*/}
      {/*  ]}*/}
      {/*  onPress={onPlayPress}*/}
      {/*  onLayout={onLayout}*/}
      {/*  accessibilityRole="button"*/}
      {/*  accessibilityHint={_(msg`Plays the GIF`)}*/}
      {/*  accessibilityLabel={_(msg`Play ${link.title}`)}>*/}
      {/*  {(!isPrefetched || !isAnimating) && ( // If we have not loaded or are not animating, show the overlay*/}
      {/*    <View style={[styles.layer, styles.overlayLayer]}>*/}
      {/*      <View style={[styles.overlayContainer, styles.topRadius]}>*/}
      {/*        {!isAnimating || !isPlayerActive ? ( // Play button when not animating or not active*/}
      {/*          <FontAwesomeIcon icon="play" size={42} color="white" />*/}
      {/*        ) : (*/}
      {/*          // Activity indicator while gif loads*/}
      {/*          <ActivityIndicator size="large" color="white" />*/}
      {/*        )}*/}
      {/*      </View>*/}
      {/*    </View>*/}
      {/*  )}*/}
      {/*  <Image*/}
      {/*    source={{*/}
      {/*      uri:*/}
      {/*        !isPrefetched || (isWeb && !isAnimating)*/}
      {/*          ? link.thumb*/}
      {/*          : params.playerUri,*/}
      {/*    }} // Web uses the thumb to control playback*/}
      {/*    style={{flex: 1}}*/}
      {/*    ref={imageRef}*/}
      {/*    onLoad={onLoad}*/}
      {/*    autoplay={isAnimating}*/}
      {/*    contentFit="contain"*/}
      {/*    accessibilityIgnoresInvertColors*/}
      {/*    accessibilityLabel={link.title}*/}
      {/*    accessibilityHint={link.title}*/}
      {/*    cachePolicy={isIOS ? 'disk' : 'memory-disk'} // cant control playback with memory-disk on ios*/}
      {/*  />*/}
      {/*</Pressable>*/}
    </>
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
  gifContainer: {
    width: '100%',
    overflow: 'hidden',
  },
})

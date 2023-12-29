import {EmbedPlayerParams, getGifHeight} from 'lib/strings/embed-player.ts'
import React from 'react'
import {Image, ImageLoadEventData} from 'expo-image'
import {
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {isIOS, isNative, isWeb} from 'platform/detection.ts'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {WebGifStill} from 'view/com/util/post-embeds/WebGifStill.tsx'

export function ExternalGifEmbed({
  thumb,
  params,
}: {
  thumb?: string
  params: EmbedPlayerParams
}) {
  const loadCount = React.useRef(0)
  const viewWidth = React.useRef(0)

  // Tracking if the placer has been activated
  const [isPlayerActive, setIsPlayerActive] = React.useState(false)
  // Tracking whether the gif has been loaded yet
  const [isLoaded, setIsLoaded] = React.useState(false)
  // Tracking whether the image is animating
  const [isAnimating, setIsAnimating] = React.useState(true)
  const [imageDims, setImageDims] = React.useState({height: 100, width: 1})

  // Used for controlling animation
  const imageRef = React.useRef<Image>(null)

  const onPlayPress = React.useCallback(
    (event: GestureResponderEvent) => {
      // Don't propagate on web
      event.preventDefault()

      // If the player isn't active, we want to activate it and prefetch the gif
      if (!isPlayerActive) {
        setIsPlayerActive(true)

        Image.prefetch(params.playerUri).then(() => {
          // Replace the image once it's fetched
          setIsLoaded(true)
        })
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
    [isPlayerActive, params.playerUri],
  )

  const onLoad = React.useCallback((e: ImageLoadEventData) => {
    // We only want to load the thumbnail's dims and then the gif's dims. We shouldn't keep resetting dimensions
    // to prevent unnecessary prop changes!
    if (loadCount.current >= 2) return

    // Scale the height of the gif to fit the width of the container
    const scaledHeight = getGifHeight(
      e.source.height,
      e.source.width,
      viewWidth.current,
    )
    // Store those dims and update the ref
    setImageDims({height: scaledHeight, width: viewWidth.current})
    loadCount.current++
  }, [])

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    viewWidth.current = e.nativeEvent.layout.width
  }, [])

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        {height: imageDims.height},
        styles.topRadius,
        styles.gifContainer,
      ]}
      onPress={onPlayPress}
      onLayout={onLayout}>
      {(!isLoaded || !isAnimating) && ( // If we have not loaded or are not animating, show the overlay
        <View style={[styles.layer, styles.overlayLayer]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play GIF"
            accessibilityHint=""
            onPress={onPlayPress}
            style={[styles.overlayContainer, styles.topRadius]}>
            {!isAnimating || !isPlayerActive ? ( // Play button when not animating or not active
              <FontAwesomeIcon icon="play" size={42} color="white" />
            ) : (
              // Activity indicator while gif loads
              <ActivityIndicator size="large" color="white" />
            )}
          </Pressable>
        </View>
      )}
      {isWeb &&
        isPlayerActive && ( // We display the still on web when the player is active
          <View style={{position: 'absolute', height: '100%', width: '100%'}}>
            <WebGifStill source={params.playerUri} imageDims={imageDims} />
          </View>
        )}
      <ConditionalImage
        isAnimating={isAnimating}
        isLoaded={isLoaded}
        isPlayerActive={isPlayerActive}
        thumb={thumb}
        source={params.playerUri}
        imageRef={imageRef}
        onLoad={onLoad}
      />
    </Pressable>
  )
}

function ConditionalImage({
  isAnimating,
  isLoaded,
  isPlayerActive,
  thumb,
  source,
  imageRef,
  onLoad,
}: {
  isAnimating: boolean
  isLoaded: boolean
  isPlayerActive: boolean
  thumb?: string
  source: string
  imageRef: React.RefObject<Image>
  onLoad: (e: ImageLoadEventData) => void
}) {
  // We always display the image on native since we can control animation
  if (!isWeb) {
    return (
      <Image
        source={{uri: !isLoaded ? thumb : source}}
        style={{flex: 1}}
        ref={imageRef}
        onLoad={onLoad}
        autoplay={isAnimating}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        cachePolicy={isIOS ? 'disk' : 'memory-disk'}
      />
    )
  }

  // Only show the image if either the player is not active (showing the thumbnail) or we are animating (showing the gif)
  if (!isPlayerActive || isAnimating) {
    return (
      <Image
        source={{uri: !isLoaded ? thumb : source}}
        style={{flex: 1}}
        onLoad={onLoad}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        cachePolicy="memory-disk"
      />
    )
  }
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

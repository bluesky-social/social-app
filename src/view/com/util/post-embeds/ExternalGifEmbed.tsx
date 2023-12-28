import {EmbedPlayerParams, getGifHeight} from 'lib/strings/embed-player.ts'
import React from 'react'
import {Image, ImageLoadEventData} from 'expo-image'
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {isWeb} from 'platform/detection.ts'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

export function ExternalGifEmbed({
  thumb,
  params,
}: {
  thumb?: string
  params: EmbedPlayerParams
}) {
  const isThumbLoaded = React.useRef(false)
  const viewWidth = React.useRef(0)

  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(true)
  const [height, setHeight] = React.useState(100)

  const imageRef = React.useRef<Image>(null)

  const onPlayPress = React.useCallback(
    (event: GestureResponderEvent) => {
      event.preventDefault()

      if (!isLoaded) {
        setIsLoaded(true)
        return
      }

      if (isWeb) return

      setIsAnimating(prev => {
        if (prev) {
          imageRef.current?.stopAnimating()
          return false
        } else {
          imageRef.current?.startAnimating()
          return true
        }
      })
    },
    [isLoaded],
  )

  const onLoad = React.useCallback((e: ImageLoadEventData) => {
    if (isThumbLoaded.current) return

    const scaledHeight = getGifHeight(
      e.source.height,
      e.source.width,
      viewWidth.current,
    )
    setHeight(scaledHeight > 300 ? 300 : scaledHeight)
  }, [])

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    viewWidth.current = e.nativeEvent.layout.width
  }, [])

  return (
    <Pressable
      accessibilityRole="button"
      style={[{height}, styles.topRadius, styles.imageContainer]}
      onPress={onPlayPress}
      onLayout={onLayout}>
      {(!isLoaded || !isAnimating) && (
        <View style={[styles.layer, styles.overlayLayer]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play GIF"
            accessibilityHint=""
            onPress={onPlayPress}
            style={[styles.overlayContainer, styles.topRadius]}>
            <FontAwesomeIcon icon="play" size={42} color="white" />
          </Pressable>
        </View>
      )}
      <Image
        source={{uri: !isLoaded ? thumb : params.playerUri}}
        style={{flex: 1}}
        ref={imageRef}
        onLoad={onLoad}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
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
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  overlayLayer: {
    zIndex: 2,
  },
})

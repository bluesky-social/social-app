import React, {useState, useEffect, useMemo} from 'react'
import {
  Image,
  ImageStyle,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {ImageLightbox} from '../../../../state/models/shell-ui'
import {useStores} from '../../../../state'
import {colors} from '../../../lib/styles'

const MAX_HEIGHT = 300

interface Dim {
  width: number
  height: number
}

export function AutoSizedImage({
  uri,
  fullSizeUri,
  style,
}: {
  uri: string
  fullSizeUri?: string
  style: StyleProp<ImageStyle>
}) {
  const store = useStores()
  const [error, setError] = useState<string | undefined>()
  const [imgInfo, setImgInfo] = useState<Dim | undefined>()
  const [containerInfo, setContainerInfo] = useState<Dim | undefined>()
  const calculatedStyle = useMemo(() => {
    if (imgInfo && containerInfo) {
      // imgInfo.height / imgInfo.width = x / containerInfo.width
      // x = imgInfo.height / imgInfo.width * containerInfo.width
      return {
        height: Math.min(
          MAX_HEIGHT,
          (imgInfo.height / imgInfo.width) * containerInfo.width,
        ),
      }
    }
    return undefined
  }, [imgInfo, containerInfo])

  useEffect(() => {
    let aborted = false
    Image.getSize(
      uri,
      (width: number, height: number) => {
        if (!aborted) {
          setImgInfo({width, height})
        }
      },
      (error: any) => {
        if (!aborted) {
          setError(String(error))
        }
      },
    )
    return () => {
      aborted = true
    }
  }, [uri])

  const onLayout = (evt: LayoutChangeEvent) => {
    setContainerInfo({
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    })
  }

  const onPressImage = () => {
    if (fullSizeUri) {
      store.shell.openLightbox(new ImageLightbox(fullSizeUri))
    }
  }

  return (
    <View style={style}>
      <TouchableWithoutFeedback onPress={onPressImage}>
        {error ? (
          <View style={[styles.container, styles.errorContainer]}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : calculatedStyle ? (
          <View style={styles.container}>
            <Image style={calculatedStyle} source={{uri}} />
          </View>
        ) : (
          <View style={[style, styles.placeholder]} onLayout={onLayout} />
        )}
      </TouchableWithoutFeedback>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.gray1,
  },
  errorContainer: {
    backgroundColor: colors.red1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  error: {
    color: colors.red5,
  },
})

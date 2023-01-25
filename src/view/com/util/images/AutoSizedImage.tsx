import React, {useState, useEffect} from 'react'
import {
  Image,
  ImageStyle,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {Text} from '../text/Text'
import {useTheme} from '../../../lib/ThemeContext'
import {usePalette} from '../../../lib/hooks/usePalette'
import {DELAY_PRESS_IN} from './constants'

const MAX_HEIGHT = 300

interface Dim {
  width: number
  height: number
}

export function AutoSizedImage({
  uri,
  onPress,
  onLongPress,
  style,
  containerStyle,
}: {
  uri: string
  onPress?: () => void
  style?: StyleProp<ImageStyle>
  containerStyle?: StyleProp<ViewStyle>
}) {
  const theme = useTheme()
  const errPal = usePalette('error')
  const [error, setError] = useState<string | undefined>('')
  const [imgInfo, setImgInfo] = useState<Dim | undefined>()
  const [containerInfo, setContainerInfo] = useState<Dim | undefined>()

  useEffect(() => {
    let aborted = false
    if (!imgInfo) {
      Image.getSize(
        uri,
        (width: number, height: number) => {
          if (!aborted) {
            setImgInfo({width, height})
          }
        },
        (err: any) => {
          if (!aborted) {
            setError(String(err))
          }
        },
      )
    }
    return () => {
      aborted = true
    }
  }, [uri, imgInfo])

  const onLayout = (evt: LayoutChangeEvent) => {
    setContainerInfo({
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    })
  }

  let calculatedStyle: StyleProp<ViewStyle> | undefined
  if (imgInfo && containerInfo) {
    // imgInfo.height / imgInfo.width = x / containerInfo.width
    // x = imgInfo.height / imgInfo.width * containerInfo.width
    calculatedStyle = {
      height: Math.min(
        MAX_HEIGHT,
        (imgInfo.height / imgInfo.width) * containerInfo.width,
      ),
    }
  }

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayPressIn={DELAY_PRESS_IN}>
        {error ? (
          <View style={[styles.errorContainer, errPal.view, containerStyle]}>
            <Text style={errPal.text}>{error}</Text>
          </View>
        ) : calculatedStyle ? (
          <View style={[styles.container, containerStyle]}>
            <Image style={calculatedStyle} source={{uri}} />
          </View>
        ) : (
          <View
            style={[
              style,
              styles.placeholder,
              {backgroundColor: theme.palette.default.backgroundLight},
            ]}
            onLayout={onLayout}
          />
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    aspectRatio: 1,
  },
  errorContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  container: {
    overflow: 'hidden',
  },
})

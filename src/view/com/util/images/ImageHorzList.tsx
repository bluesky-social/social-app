import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'

interface Props {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  style?: StyleProp<ViewStyle>
}

export function ImageHorzList({images, onPress, style}: Props) {
  const numImages = images.length
  return (
    <View style={[styles.flexRow, style]}>
      {images.map(({thumb, alt}, i) => (
        <TouchableWithoutFeedback
          key={i}
          onPress={() => onPress?.(i)}
          accessible={true}
          accessibilityLabel={`Open image ${i} of ${numImages}`}
          accessibilityHint="Opens image in viewer"
          accessibilityActions={[{name: 'press', label: 'Press'}]}
          onAccessibilityAction={action => {
            switch (action.nativeEvent.actionName) {
              case 'press':
                onPress?.(0)
                break
              default:
                break
            }
          }}>
          <Image
            source={{uri: thumb}}
            style={styles.image}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityHint={alt}
            accessibilityLabel=""
          />
        </TouchableWithoutFeedback>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  flexRow: {flexDirection: 'row'},
  image: {
    width: 100,
    height: 100,
    borderRadius: 4,
    marginRight: 5,
  },
})

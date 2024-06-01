import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'

interface Props {
  images: AppBskyEmbedImages.ViewImage[]
  style?: StyleProp<ViewStyle>
}

export function ImageHorzList({images, style}: Props) {
  return (
    <View style={[styles.flexRow, style]}>
      {images.map(({thumb, alt}) => (
        <Image
          key={thumb}
          source={{uri: thumb}}
          style={styles.image}
          accessible={true}
          accessibilityIgnoresInvertColors
          accessibilityHint={alt}
          accessibilityLabel=""
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
    gap: 5,
  },
  image: {
    maxWidth: 100,
    aspectRatio: 1,
    flex: 1,
    borderRadius: 4,
  },
})

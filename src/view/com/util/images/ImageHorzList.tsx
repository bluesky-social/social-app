import {AppBskyEmbedImages} from '@atproto/api'
import {Image} from 'expo-image'
import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'

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
  flexRow: {flexDirection: 'row'},
  image: {
    width: 100,
    height: 100,
    borderRadius: 4,
    marginRight: 5,
  },
})

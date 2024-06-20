import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

interface Props {
  images: AppBskyEmbedImages.ViewImage[]
  style?: StyleProp<ViewStyle>
  gif?: boolean
}

export function ImageHorzList({images, style, gif}: Props) {
  return (
    <View style={[a.flex_row, a.gap_xs, style]}>
      {images.map(({thumb, alt}) => (
        <View
          key={thumb}
          style={[a.relative, a.flex_1, {aspectRatio: 1, maxWidth: 100}]}>
          <Image
            key={thumb}
            source={{uri: thumb}}
            style={[a.flex_1, a.rounded_xs]}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityHint={alt}
            accessibilityLabel=""
          />
          {gif && (
            <View style={styles.altContainer}>
              <Text style={styles.alt}>
                <Trans>GIF</Trans>
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 5,
    bottom: 5,
    zIndex: 2,
  },
  alt: {
    color: 'white',
    fontSize: 7,
    fontWeight: 'bold',
  },
})

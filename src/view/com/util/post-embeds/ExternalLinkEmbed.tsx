import React from 'react'
import {Image} from 'expo-image'
import {Text} from '../text/Text'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {AppBskyEmbedExternal} from '@atproto/api'

export const ExternalLinkEmbed = ({
  link,
  imageChild,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  imageChild?: React.ReactNode
}) => {
  const pal = usePalette('default')
  return (
    <>
      {link.thumb ? (
        <View style={styles.extImageContainer}>
          <Image
            style={styles.extImage}
            source={{uri: link.thumb}}
            accessibilityIgnoresInvertColors
          />
          {imageChild}
        </View>
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
    </>
  )
}

const styles = StyleSheet.create({
  extInner: {
    padding: 10,
  },
  extImageContainer: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  extImage: {
    width: '100%',
    height: 200,
  },
  extUri: {
    marginTop: 2,
  },
  extDescription: {
    marginTop: 4,
  },
})

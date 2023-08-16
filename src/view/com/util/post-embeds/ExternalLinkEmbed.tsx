import React from 'react'
import {Image} from 'expo-image'
import {Text} from '../text/Text'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {AppBskyEmbedExternal} from '@atproto/api'
import {isDesktopWeb} from 'platform/detection'
import {toNiceDomain} from 'lib/strings/url-helpers'

export const ExternalLinkEmbed = ({
  link,
  imageChild,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  imageChild?: React.ReactNode
}) => {
  const pal = usePalette('default')
  return (
    <View style={styles.extContainer}>
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
        <Text
          type="sm"
          numberOfLines={1}
          style={[pal.textLight, styles.extUri]}>
          {toNiceDomain(link.uri)}
        </Text>
        <Text
          type="lg-bold"
          numberOfLines={isDesktopWeb ? 2 : 4}
          style={[pal.text]}>
          {link.title || link.uri}
        </Text>
        {link.description ? (
          <Text
            type="md"
            numberOfLines={isDesktopWeb ? 2 : 4}
            style={[pal.text, styles.extDescription]}>
            {link.description}
          </Text>
        ) : undefined}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  extContainer: {
    flexDirection: isDesktopWeb ? 'row' : 'column',
  },
  extInner: {
    paddingHorizontal: isDesktopWeb ? 14 : 10,
    paddingTop: 8,
    paddingBottom: 10,
    flex: isDesktopWeb ? 1 : undefined,
  },
  extImageContainer: isDesktopWeb
    ? {
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
        width: 120,
        aspectRatio: 1,
        overflow: 'hidden',
      }
    : {
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

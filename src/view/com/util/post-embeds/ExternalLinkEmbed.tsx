import React from 'react'
import {Image} from 'expo-image'
import {Text} from '../text/Text'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {AppBskyEmbedExternal} from '@atproto/api'
import {toNiceDomain} from 'lib/strings/url-helpers'

export const ExternalLinkEmbed = ({
  link,
  imageChild,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  imageChild?: React.ReactNode
}) => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  return (
    <View
      style={{
        flexDirection: isMobile ? 'column' : 'row',
      }}>
      {link.thumb ? (
        <View
          style={
            !isMobile
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
                }
          }>
          <Image
            style={styles.extImage}
            source={{uri: link.thumb}}
            accessibilityIgnoresInvertColors
          />
          {imageChild}
        </View>
      ) : undefined}
      <View
        style={{
          paddingHorizontal: isMobile ? 10 : 14,
          paddingTop: 8,
          paddingBottom: 10,
          flex: !isMobile ? 1 : undefined,
        }}>
        <Text
          type="sm"
          numberOfLines={1}
          style={[pal.textLight, styles.extUri]}>
          {toNiceDomain(link.uri)}
        </Text>
        <Text
          type="lg-bold"
          numberOfLines={isMobile ? 4 : 2}
          style={[pal.text]}>
          {link.title || link.uri}
        </Text>
        {link.description ? (
          <Text
            type="md"
            numberOfLines={isMobile ? 4 : 2}
            style={[pal.text, styles.extDescription]}>
            {link.description}
          </Text>
        ) : undefined}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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

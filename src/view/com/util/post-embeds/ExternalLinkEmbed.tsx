import React from 'react'
import {Image} from 'expo-image'
import {Text} from '../text/Text'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {AppBskyEmbedExternal} from '@atproto/api'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {parseEmbedPlayerFromUrl} from 'lib/strings/embed-player'
import {ExternalPlayer} from 'view/com/util/post-embeds/ExternalPlayerEmbed'

export const ExternalLinkEmbed = ({
  link,
}: {
  link: AppBskyEmbedExternal.ViewExternal
}) => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()

  const embedPlayerParams = React.useMemo(
    () => parseEmbedPlayerFromUrl(link.uri),
    [link.uri],
  )

  return (
    <View
      style={{
        flexDirection: !isMobile && !embedPlayerParams ? 'row' : 'column',
      }}>
      {link.thumb && !embedPlayerParams ? (
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
        </View>
      ) : undefined}
      {embedPlayerParams && (
        <ExternalPlayer link={link} params={embedPlayerParams} />
      )}
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

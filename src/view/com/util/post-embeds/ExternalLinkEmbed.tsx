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
import {ExternalGifEmbed} from 'view/com/util/post-embeds/ExternalGifEmbed'
import {useExternalEmbedsPrefs} from 'state/preferences'

export const ExternalLinkEmbed = ({
  link,
}: {
  link: AppBskyEmbedExternal.ViewExternal
}) => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const externalEmbedPrefs = useExternalEmbedsPrefs()

  const embedPlayerParams = React.useMemo(() => {
    const params = parseEmbedPlayerFromUrl(link.uri)

    if (params && externalEmbedPrefs?.[params.source] !== 'hide') {
      return params
    }
  }, [link.uri, externalEmbedPrefs])

  return (
    <View style={{flexDirection: 'column'}}>
      {link.thumb && !embedPlayerParams ? (
        <View
          style={{
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            width: '100%',
            height: isMobile ? 200 : 300,
            overflow: 'hidden',
          }}>
          <Image
            style={styles.extImage}
            source={{uri: link.thumb}}
            accessibilityIgnoresInvertColors
          />
        </View>
      ) : undefined}
      {(embedPlayerParams?.isGif && (
        <ExternalGifEmbed link={link} params={embedPlayerParams} />
      )) ||
        (embedPlayerParams && (
          <ExternalPlayer link={link} params={embedPlayerParams} />
        ))}
      <View
        style={{
          paddingHorizontal: isMobile ? 10 : 14,
          paddingTop: 8,
          paddingBottom: 10,
        }}>
        <Text
          type="sm"
          numberOfLines={1}
          style={[pal.textLight, styles.extUri]}>
          {toNiceDomain(link.uri)}
        </Text>
        {!embedPlayerParams?.isGif && (
          <Text type="lg-bold" numberOfLines={4} style={[pal.text]}>
            {link.title || link.uri}
          </Text>
        )}
        {link.description && !embedPlayerParams?.hideDetails ? (
          <Text
            type="md"
            numberOfLines={4}
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
    flex: 1,
  },
  extUri: {
    marginTop: 2,
  },
  extDescription: {
    marginTop: 4,
  },
})

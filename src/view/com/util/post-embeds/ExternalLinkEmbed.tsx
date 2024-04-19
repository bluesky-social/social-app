import React, {useCallback} from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'

import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {shareUrl} from 'lib/sharing'
import {useGate} from 'lib/statsig/statsig'
import {parseEmbedPlayerFromUrl} from 'lib/strings/embed-player'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {isNative} from 'platform/detection'
import {useExternalEmbedsPrefs} from 'state/preferences'
import {Link} from 'view/com/util/Link'
import {ExternalGifEmbed} from 'view/com/util/post-embeds/ExternalGifEmbed'
import {ExternalPlayer} from 'view/com/util/post-embeds/ExternalPlayerEmbed'
import {VideoPlayer} from '../../../../../modules/expo-bluesky-video-player'
import {Text} from '../text/Text'

export const ExternalLinkEmbed = ({
  link,
  style,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  style?: StyleProp<ViewStyle>
}) => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const externalEmbedPrefs = useExternalEmbedsPrefs()
  const gate = useGate()

  const embedPlayerParams = React.useMemo(() => {
    const params = parseEmbedPlayerFromUrl(link.uri)

    if (params && externalEmbedPrefs?.[params.source] !== 'hide') {
      return params
    }
  }, [link.uri, externalEmbedPrefs])
  const isCompatibleGiphy =
    embedPlayerParams?.source === 'giphy' &&
    embedPlayerParams.dimensions &&
    gate('new_gif_player')

  return (
    <View style={styles.container}>
      {isCompatibleGiphy ? (
        <VideoPlayer style={{}} source={embedPlayerParams.playerUri} />
      ) : (
        <LinkWrapper link={link} style={style}>
          {link.thumb && !embedPlayerParams ? (
            <Image
              style={{aspectRatio: 1.91}}
              source={{uri: link.thumb}}
              accessibilityIgnoresInvertColors
            />
          ) : undefined}
          {embedPlayerParams?.isGif ? (
            <ExternalGifEmbed link={link} params={embedPlayerParams} />
          ) : embedPlayerParams ? (
            <ExternalPlayer link={link} params={embedPlayerParams} />
          ) : undefined}
          <View style={[styles.info, {paddingHorizontal: isMobile ? 10 : 14}]}>
            {!isCompatibleGiphy && (
              <Text
                type="sm"
                numberOfLines={1}
                style={[pal.textLight, styles.extUri]}>
                {toNiceDomain(link.uri)}
              </Text>
            )}

            {!embedPlayerParams?.isGif && !embedPlayerParams?.dimensions && (
              <Text type="lg-bold" numberOfLines={3} style={[pal.text]}>
                {link.title || link.uri}
              </Text>
            )}
            {link.description && !embedPlayerParams?.hideDetails ? (
              <Text
                type="md"
                numberOfLines={link.thumb ? 2 : 4}
                style={[pal.text, styles.extDescription]}>
                {link.description}
              </Text>
            ) : undefined}
          </View>
        </LinkWrapper>
      )}
    </View>
  )
}

function LinkWrapper({
  link,
  style,
  children,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const pal = usePalette('default')

  const onShareExternal = useCallback(() => {
    if (link.uri && isNative) {
      shareUrl(link.uri)
    }
  }, [link.uri])

  return (
    <Link
      asAnchor
      anchorNoUnderline
      href={link.uri}
      style={[styles.extOuter, pal.view, pal.borderDark, style]}
      hoverStyle={{borderColor: pal.colors.borderLinkHover}}
      onLongPress={onShareExternal}>
      {children}
    </Link>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    borderRadius: 6,
    overflow: 'hidden',
  },
  info: {
    width: '100%',
    bottom: 0,
    paddingTop: 8,
    paddingBottom: 10,
  },
  extUri: {
    marginTop: 2,
  },
  extDescription: {
    marginTop: 4,
  },
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
})

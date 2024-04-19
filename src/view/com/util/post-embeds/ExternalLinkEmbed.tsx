import React, {useCallback} from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {shareUrl} from 'lib/sharing'
import {useGate} from 'lib/statsig/statsig'
import {
  EmbedPlayerParams,
  parseEmbedPlayerFromUrl,
} from 'lib/strings/embed-player'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {isNative} from 'platform/detection'
import {useExternalEmbedsPrefs} from 'state/preferences'
import {Link} from 'view/com/util/Link'
import {ExternalGifEmbed} from 'view/com/util/post-embeds/ExternalGifEmbed'
import {ExternalPlayer} from 'view/com/util/post-embeds/ExternalPlayerEmbed'
import {atoms as a, useTheme} from '#/alf'
import {VideoPlayer} from '../../../../../modules/expo-bluesky-video-player'
import {VideoPlayerStateChangeEvent} from '../../../../../modules/expo-bluesky-video-player/src/VideoPlayer.types'
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

  if (isCompatibleGiphy) {
    return <VideoEmbed params={embedPlayerParams} />
  }

  return (
    <View style={styles.container}>
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

function VideoEmbed({params}: {params: EmbedPlayerParams}) {
  const t = useTheme()
  const playerRef = React.useRef<VideoPlayer>(null)

  // TODO this should always start as the user's autoplay preference
  const [isPlaying, setIsPlaying] = React.useState(true)

  const onPlayerStateChange = React.useCallback(
    (e: VideoPlayerStateChangeEvent) => {
      setIsPlaying(e.nativeEvent.isPlaying)
    },
    [],
  )

  const onPress = React.useCallback(() => {
    playerRef.current?.toggleAsync()
  }, [])

  return (
    <View style={styles.video}>
      <Pressable
        accessibilityRole="button"
        style={[
          a.absolute,
          a.align_center,
          a.justify_center,
          {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 1,
            backgroundColor: !isPlaying ? 'rgba(0, 0, 0, 0.3)' : undefined,
          },
        ]}
        onPress={onPress}>
        {!isPlaying && (
          <View
            style={[
              a.rounded_full,
              a.align_center,
              a.justify_center,
              {
                backgroundColor: t.palette.primary_500,
                width: 60,
                height: 60,
              },
            ]}>
            <FontAwesomeIcon
              icon="play"
              size={42}
              color="white"
              style={{marginLeft: 8}}
            />
          </View>
        )}
      </Pressable>
      <VideoPlayer
        // Need to flatten for web
        source={params.playerUri}
        // TODO -hailey
        autoplay={true}
        onPlayerStateChange={onPlayerStateChange}
        ref={playerRef}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  video: {
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 8,
  },
  videoWeb: {},
  videoNative: {},

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

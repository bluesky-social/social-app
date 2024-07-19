import React, {useCallback} from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {shareUrl} from 'lib/sharing'
import {parseEmbedPlayerFromUrl} from 'lib/strings/embed-player'
import {
  getStarterPackOgCard,
  parseStarterPackUri,
} from 'lib/strings/starter-pack'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {isNative} from 'platform/detection'
import {useExternalEmbedsPrefs} from 'state/preferences'
import {Link} from 'view/com/util/Link'
import {ExternalGifEmbed} from 'view/com/util/post-embeds/ExternalGifEmbed'
import {ExternalPlayer} from 'view/com/util/post-embeds/ExternalPlayerEmbed'
import {GifEmbed} from 'view/com/util/post-embeds/GifEmbed'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '../text/Text'

export const ExternalLinkEmbed = ({
  link,
  onOpen,
  style,
  hideAlt,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  hideAlt?: boolean
}) => {
  const {_} = useLingui()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const externalEmbedPrefs = useExternalEmbedsPrefs()

  const starterPackParsed = parseStarterPackUri(link.uri)
  const imageUri = starterPackParsed
    ? getStarterPackOgCard(starterPackParsed.name, starterPackParsed.rkey)
    : link.thumb

  const embedPlayerParams = React.useMemo(() => {
    const params = parseEmbedPlayerFromUrl(link.uri)

    if (params && externalEmbedPrefs?.[params.source] !== 'hide') {
      return params
    }
  }, [link.uri, externalEmbedPrefs])

  if (embedPlayerParams?.source === 'tenor') {
    return <GifEmbed params={embedPlayerParams} link={link} hideAlt={hideAlt} />
  }

  return (
    <View style={[a.flex_col, a.rounded_sm, a.overflow_hidden]}>
      <LinkWrapper link={link} onOpen={onOpen} style={style}>
        {imageUri && !embedPlayerParams ? (
          <Image
            style={{
              aspectRatio: 1.91,
              borderTopRightRadius: 6,
              borderTopLeftRadius: 6,
            }}
            source={{uri: imageUri}}
            accessibilityIgnoresInvertColors
            accessibilityLabel={starterPackParsed ? link.title : undefined}
            accessibilityHint={
              starterPackParsed ? _(msg`Navigate to starter pack`) : undefined
            }
          />
        ) : undefined}
        {embedPlayerParams?.isGif ? (
          <ExternalGifEmbed link={link} params={embedPlayerParams} />
        ) : embedPlayerParams ? (
          <ExternalPlayer link={link} params={embedPlayerParams} />
        ) : undefined}
        <View
          style={[
            a.flex_1,
            a.py_sm,
            {
              paddingHorizontal: isMobile ? 10 : 14,
            },
          ]}>
          <Text
            type="sm"
            numberOfLines={1}
            style={[pal.textLight, {marginVertical: 2}]}>
            {toNiceDomain(link.uri)}
          </Text>

          {!embedPlayerParams?.isGif && !embedPlayerParams?.dimensions && (
            <Text type="lg-bold" numberOfLines={3} style={[pal.text]}>
              {link.title || link.uri}
            </Text>
          )}
          {link.description ? (
            <Text
              type="md"
              numberOfLines={link.thumb ? 2 : 4}
              style={[pal.text, a.mt_xs]}>
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
  onOpen,
  style,
  children,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const t = useTheme()

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
      style={[
        a.flex_1,
        a.border,
        a.rounded_sm,
        t.atoms.border_contrast_medium,
        style,
      ]}
      hoverStyle={t.atoms.border_contrast_high}
      onBeforePress={onOpen}
      onLongPress={onShareExternal}>
      {children}
    </Link>
  )
}

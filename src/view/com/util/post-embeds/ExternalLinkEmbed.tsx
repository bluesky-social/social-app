import React, {useCallback} from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'

import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {shareUrl} from '#/lib/sharing'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {Link} from '#/view/com/util/Link'
import {ExternalGifEmbed} from '#/view/com/util/post-embeds/ExternalGifEmbed'
import {ExternalPlayer} from '#/view/com/util/post-embeds/ExternalPlayerEmbed'
import {GifEmbed} from '#/view/com/util/post-embeds/GifEmbed'
import {atoms as a, useTheme} from '#/alf'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
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
  const pal = usePalette('default')
  const t = useTheme()
  const {isMobile} = useWebMediaQueries()
  const externalEmbedPrefs = useExternalEmbedsPrefs()
  const imageUri = link.thumb

  const embedPlayerParams = React.useMemo(() => {
    const params = parseEmbedPlayerFromUrl(link.uri)

    if (params && externalEmbedPrefs?.[params.source] !== 'hide') {
      return params
    }
  }, [link.uri, externalEmbedPrefs])

  if (embedPlayerParams?.source === 'tenor') {
    const parsedAlt = parseAltFromGIFDescription(link.description)
    return (
      <GifEmbed
        params={embedPlayerParams}
        thumb={link.thumb}
        altText={parsedAlt.alt}
        isPreferredAltText={parsedAlt.isPreferred}
        hideAlt={hideAlt}
      />
    )
  }

  return (
    <View style={[a.flex_col, a.rounded_md, a.w_full]}>
      <LinkWrapper link={link} onOpen={onOpen} style={style}>
        {imageUri && !embedPlayerParams ? (
          <View>
            <Image
              style={{
                aspectRatio: 1.91,
                borderTopRightRadius: a.rounded_md.borderRadius,
                borderTopLeftRadius: a.rounded_md.borderRadius,
              }}
              source={{uri: imageUri}}
              accessibilityIgnoresInvertColors
              accessibilityLabel={undefined}
              accessibilityHint={undefined}
            />
            <MediaInsetBorder
              opaque
              style={[
                {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              ]}
            />
          </View>
        ) : undefined}
        {embedPlayerParams?.isGif ? (
          <ExternalGifEmbed link={link} params={embedPlayerParams} />
        ) : embedPlayerParams ? (
          <ExternalPlayer link={link} params={embedPlayerParams} />
        ) : undefined}
        <View
          style={[
            a.border_b,
            a.border_l,
            a.border_r,
            a.flex_1,
            a.py_sm,
            t.atoms.border_contrast_low,
            {
              borderBottomRightRadius: a.rounded_md.borderRadius,
              borderBottomLeftRadius: a.rounded_md.borderRadius,
              paddingHorizontal: isMobile ? 10 : 14,
            },
            !imageUri && !embedPlayerParams && [a.border, a.rounded_md],
          ]}>
          <Text
            type="sm"
            numberOfLines={1}
            style={[pal.textLight, {marginVertical: 2}]}>
            {toNiceDomain(link.uri)}
          </Text>

          {!embedPlayerParams?.isGif && !embedPlayerParams?.dimensions && (
            <Text emoji type="lg-bold" numberOfLines={3} style={[pal.text]}>
              {link.title || link.uri}
            </Text>
          )}
          {link.description ? (
            <Text
              emoji
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
      style={[a.flex_1, a.rounded_sm, style]}
      onBeforePress={onOpen}
      onLongPress={onShareExternal}>
      {children}
    </Link>
  )
}

import React, {useCallback} from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {shareUrl} from '#/lib/sharing'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {
  getStarterPackOgCard,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {Link} from '#/view/com/util/Link'
import {ExternalGifEmbed} from '#/view/com/util/post-embeds/ExternalGifEmbed'
import {ExternalPlayer} from '#/view/com/util/post-embeds/ExternalPlayerEmbed'
import {GifEmbed} from '#/view/com/util/post-embeds/GifEmbed'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Earth_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'

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
  const t = useTheme()
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
    <View
      style={[a.flex_col, a.rounded_md, a.overflow_hidden, a.w_full, style]}>
      <LinkWrapper link={link} onOpen={onOpen}>
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
              accessibilityLabel={starterPackParsed ? link.title : undefined}
              accessibilityHint={
                starterPackParsed ? _(msg`Navigate to starter pack`) : undefined
              }
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
            a.pt_sm,
            a.gap_xs,
            a.overflow_hidden,
            t.atoms.border_contrast_low,
            {
              borderBottomRightRadius: a.rounded_md.borderRadius,
              borderBottomLeftRadius: a.rounded_md.borderRadius,
            },
            !imageUri && !embedPlayerParams && [a.border, a.rounded_md],
          ]}>
          <View style={[a.gap_xs, a.pb_xs, a.px_md]}>
            {!embedPlayerParams?.isGif && !embedPlayerParams?.dimensions && (
              <Text
                emoji
                numberOfLines={3}
                style={[a.text_md, a.font_bold, a.leading_snug]}>
                {link.title || link.uri}
              </Text>
            )}
            {link.description ? (
              <Text
                emoji
                numberOfLines={link.thumb ? 2 : 4}
                style={[a.text_sm, a.leading_snug]}>
                {link.description}
              </Text>
            ) : undefined}
          </View>
          <View style={[a.px_md]}>
            <Divider />
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_2xs,
                a.pb_sm,
                {
                  paddingTop: 6, // off menu
                },
              ]}>
              <Globe size="xs" fill={t.atoms.text_contrast_low.color} />
              <Text
                numberOfLines={1}
                style={[
                  a.text_xs,
                  a.leading_tight,
                  t.atoms.text_contrast_medium,
                ]}>
                {toNiceDomain(link.uri)}
              </Text>
            </View>
          </View>
        </View>
      </LinkWrapper>
    </View>
  )
}

function LinkWrapper({
  link,
  onOpen,
  children,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  onOpen?: () => void
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
      onBeforePress={onOpen}
      onLongPress={onShareExternal}>
      {children}
    </Link>
  )
}

import React, {useCallback} from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {shareUrl} from '#/lib/sharing'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {ExternalGifEmbed} from '#/view/com/util/post-embeds/ExternalGifEmbed'
import {ExternalPlayer} from '#/view/com/util/post-embeds/ExternalPlayerEmbed'
import {GifEmbed} from '#/view/com/util/post-embeds/GifEmbed'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Earth_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Link} from '#/components/Link'
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
  const niceUrl = toNiceDomain(link.uri)
  const imageUri = link.thumb
  const embedPlayerParams = React.useMemo(() => {
    const params = parseEmbedPlayerFromUrl(link.uri)

    if (params && externalEmbedPrefs?.[params.source] !== 'hide') {
      return params
    }
  }, [link.uri, externalEmbedPrefs])
  const hasMedia = Boolean(imageUri || embedPlayerParams)

  const onShareExternal = useCallback(() => {
    if (link.uri && isNative) {
      shareUrl(link.uri)
    }
  }, [link.uri])

  if (embedPlayerParams?.source === 'tenor') {
    const parsedAlt = parseAltFromGIFDescription(link.description)
    return (
      <View style={style}>
        <GifEmbed
          params={embedPlayerParams}
          thumb={link.thumb}
          altText={parsedAlt.alt}
          isPreferredAltText={parsedAlt.isPreferred}
          hideAlt={hideAlt}
        />
      </View>
    )
  }

  return (
    <Link
      label={link.title || _(msg`Open link to ${niceUrl}`)}
      to={link.uri}
      shouldProxy={true}
      onPress={onOpen}
      onLongPress={onShareExternal}>
      {({hovered}) => (
        <View
          style={[
            a.transition_color,
            a.flex_col,
            a.rounded_md,
            a.overflow_hidden,
            a.w_full,
            a.border,
            style,
            hovered
              ? t.atoms.border_contrast_high
              : t.atoms.border_contrast_low,
          ]}>
          {imageUri && !embedPlayerParams ? (
            <Image
              style={{
                aspectRatio: 1.91,
              }}
              source={{uri: imageUri}}
              accessibilityIgnoresInvertColors
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
              a.pt_sm,
              {gap: 3},
              hasMedia && a.border_t,
              hovered
                ? t.atoms.border_contrast_high
                : t.atoms.border_contrast_low,
            ]}>
            <View style={[{gap: 3}, a.pb_xs, a.px_md]}>
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
                <Globe
                  size="xs"
                  style={[
                    a.transition_color,
                    hovered
                      ? t.atoms.text_contrast_medium
                      : t.atoms.text_contrast_low,
                  ]}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    a.transition_color,
                    a.text_xs,
                    a.leading_snug,
                    hovered
                      ? t.atoms.text_contrast_high
                      : t.atoms.text_contrast_medium,
                  ]}>
                  {toNiceDomain(link.uri)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Link>
  )
}

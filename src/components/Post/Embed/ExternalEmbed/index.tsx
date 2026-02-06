import React, {useCallback} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useExternalEmbedsPrefs} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Earth_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {ExternalGif} from './ExternalGif'
import {ExternalPlayer} from './ExternalPlayer'
import {GifEmbed} from './Gif'

export const ExternalEmbed = ({
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
  const playHaptic = useHaptics()
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

  const onPress = useCallback(() => {
    playHaptic('Light')
    onOpen?.()
  }, [playHaptic, onOpen])

  const onShareExternal = useCallback(() => {
    if (link.uri && IS_NATIVE) {
      playHaptic('Heavy')
      shareUrl(link.uri)
    }
  }, [link.uri, playHaptic])

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
      onPress={onPress}
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
              style={[a.aspect_card]}
              source={{uri: imageUri}}
              accessibilityIgnoresInvertColors
              loading="lazy"
            />
          ) : undefined}

          {embedPlayerParams?.isGif ? (
            <ExternalGif link={link} params={embedPlayerParams} />
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
                  style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
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

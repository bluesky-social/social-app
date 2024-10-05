import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'

import {ExternalEmbedDraft} from '#/lib/api/index'
import {cleanError} from '#/lib/strings/errors'
import {
  useResolveGifQuery,
  useResolveLinkQuery,
} from '#/state/queries/resolve-link'
import {Gif} from '#/state/queries/tenor'
import {ExternalEmbedRemoveBtn} from '#/view/com/composer/ExternalEmbedRemoveBtn'
import {ExternalLinkEmbed} from '#/view/com/util/post-embeds/ExternalLinkEmbed'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export const ExternalEmbedGif = ({
  onRemove,
  gif,
}: {
  onRemove: () => void
  gif: Gif
}) => {
  const t = useTheme()
  const {data, error} = useResolveGifQuery(gif)
  const linkInfo = React.useMemo(
    () =>
      data && {
        title: data.title ?? data.uri,
        uri: data.uri,
        description: data.description ?? '',
        thumb: data.thumb?.source.path,
      },
    [data],
  )

  const loadingStyle: ViewStyle = {
    aspectRatio: gif.media_formats.gif.dims[0] / gif.media_formats.gif.dims[1],
    width: '100%',
  }

  return (
    <View style={[a.overflow_hidden, t.atoms.border_contrast_medium]}>
      {linkInfo ? (
        <View style={{pointerEvents: 'auto'}}>
          <ExternalLinkEmbed link={linkInfo} hideAlt />
        </View>
      ) : error ? (
        <Container style={[a.align_start, a.p_md, a.gap_xs]}>
          <Text numberOfLines={1} style={t.atoms.text_contrast_high}>
            {gif.url}
          </Text>
          <Text numberOfLines={2} style={[{color: t.palette.negative_400}]}>
            {cleanError(error)}
          </Text>
        </Container>
      ) : (
        <Container style={loadingStyle}>
          <Loader size="xl" />
        </Container>
      )}
      <ExternalEmbedRemoveBtn onRemove={onRemove} />
    </View>
  )
}

export const ExternalEmbedLink = ({
  link,
  onRemove,
}: {
  link: ExternalEmbedDraft
  onRemove: () => void
}) => {
  const t = useTheme()
  const {data, error} = useResolveLinkQuery(link.uri)
  const externalData = data?.type === 'external' ? data : null
  const linkInfo = React.useMemo(
    () =>
      externalData && {
        title: externalData.title ?? externalData.uri,
        uri: externalData.uri,
        description: externalData.description ?? '',
        thumb: externalData.thumb?.source.path,
      },
    [externalData],
  )

  if (data?.type === 'record') {
    return null // TODO: Display record embeds.
  }

  return (
    <View style={[a.mb_xl, a.overflow_hidden, t.atoms.border_contrast_medium]}>
      {linkInfo ? (
        <View style={{pointerEvents: 'none'}}>
          <ExternalLinkEmbed link={linkInfo} hideAlt />
        </View>
      ) : error ? (
        <Container style={[a.align_start, a.p_md, a.gap_xs]}>
          <Text numberOfLines={1} style={t.atoms.text_contrast_high}>
            {link.uri}
          </Text>
          <Text numberOfLines={2} style={[{color: t.palette.negative_400}]}>
            {cleanError(error)}
          </Text>
        </Container>
      ) : (
        <Container>
          <Loader size="xl" />
        </Container>
      )}
      <ExternalEmbedRemoveBtn onRemove={onRemove} />
    </View>
  )
}

function Container({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.mt_sm,
        a.rounded_sm,
        a.border,
        a.align_center,
        a.justify_center,
        a.py_5xl,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_medium,
        style,
      ]}>
      {children}
    </View>
  )
}

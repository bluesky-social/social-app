import React from 'react'
import {StyleProp, TouchableOpacity, View, ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {s} from '#/lib/styles'
import {useLinkMetaQuery} from '#/state/queries/link-meta'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {ExternalLinkEmbed} from '../../util/post-embeds/ExternalLinkEmbed'
import {InertContents} from '../components/InertContents'
import {ComposerAction, PostExternalEmbed} from '../state'

export const ExternalEmbed = ({
  active,
  postId,
  embed,
  dispatch,
  isGif,
}: {
  active: boolean
  postId: string
  embed: PostExternalEmbed
  dispatch: React.Dispatch<ComposerAction>
  isGif?: boolean
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()

  const {data: link} = useLinkMetaQuery(embed.uri)

  const linkInfo = React.useMemo(
    () =>
      link && {
        title: link.meta?.title ?? embed.uri,
        uri: embed.uri,
        description: link.meta?.description ?? '',
        thumb: link.thumb?.source.path,
      },
    [link, embed],
  )

  const onRemove = () => {
    dispatch({type: 'embed_remove_media', postId})
  }

  return (
    <View style={[a.overflow_hidden, t.atoms.border_contrast_medium]}>
      {!link ? (
        <Container>
          <Loader size="xl" />
        </Container>
      ) : link.meta.error ? (
        <Container style={[a.align_start, a.p_md, a.gap_xs]}>
          <Text numberOfLines={1} style={t.atoms.text_contrast_high}>
            {embed.uri}
          </Text>
          <Text numberOfLines={2} style={[{color: t.palette.negative_400}]}>
            {link.meta.error}
          </Text>
        </Container>
      ) : linkInfo ? (
        <InertContents inert={!active || !isGif}>
          {/* @todo: <ExternalLinkEmbed> adds a top margin of its own */}
          <ExternalLinkEmbed link={linkInfo} hideAlt />
        </InertContents>
      ) : null}

      {active && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 16,
            right: 10,
            height: 36,
            width: 36,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Remove link`)}
          accessibilityHint={_(msg`Remove link embed pointing to ${embed.uri}`)}
          onAccessibilityEscape={onRemove}>
          <FontAwesomeIcon size={18} icon="xmark" style={s.white} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const Container = ({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) => {
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

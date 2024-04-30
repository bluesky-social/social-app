import React from 'react'
import {StyleProp, TouchableOpacity, View, ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ExternalEmbedDraft} from 'lib/api/index'
import {s} from 'lib/styles'
import {Gif} from 'state/queries/tenor'
import {ExternalLinkEmbed} from 'view/com/util/post-embeds/ExternalLinkEmbed'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export const ExternalEmbed = ({
  link,
  onRemove,
  gif,
}: {
  link?: ExternalEmbedDraft
  onRemove: () => void
  gif?: Gif
}) => {
  const t = useTheme()
  const {_} = useLingui()

  const linkInfo = React.useMemo(
    () =>
      link && {
        title: link.meta?.title ?? link.uri,
        uri: link.uri,
        description: link.meta?.description ?? '',
        thumb: link.localThumb?.path,
      },
    [link],
  )

  if (!link) return null

  const loadingStyle: ViewStyle | undefined = gif
    ? {
        aspectRatio:
          gif.media_formats.gif.dims[0] / gif.media_formats.gif.dims[1],
        width: '100%',
      }
    : undefined

  return (
    <View style={[a.mb_xl, a.overflow_hidden, t.atoms.border_contrast_medium]}>
      {link.isLoading ? (
        <Container style={loadingStyle}>
          <Loader size="xl" />
        </Container>
      ) : link.meta?.error ? (
        <Container style={[a.align_start, a.p_md, a.gap_xs]}>
          <Text numberOfLines={1} style={t.atoms.text_contrast_high}>
            {link.uri}
          </Text>
          <Text numberOfLines={2} style={[{color: t.palette.negative_400}]}>
            {link.meta?.error}
          </Text>
        </Container>
      ) : linkInfo ? (
        <View style={{pointerEvents: !gif ? 'none' : 'auto'}}>
          <ExternalLinkEmbed link={linkInfo} />
        </View>
      ) : null}
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
        accessibilityLabel={_(msg`Remove image preview`)}
        accessibilityHint={_(msg`Removes default thumbnail from ${link.uri}`)}
        onAccessibilityEscape={onRemove}>
        <FontAwesomeIcon size={18} icon="xmark" style={s.white} />
      </TouchableOpacity>
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

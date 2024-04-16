import React from 'react'
import {TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ExternalEmbedDraft} from 'lib/api/index'
import {s} from 'lib/styles'
import {ExternalLinkEmbed} from 'view/com/util/post-embeds/ExternalLinkEmbed'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export const ExternalEmbed = ({
  link,
  onRemove,
}: {
  link?: ExternalEmbedDraft
  onRemove: () => void
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

  return (
    <View
      style={[
        a.border,
        a.rounded_sm,
        a.mt_2xl,
        a.mb_xl,
        a.overflow_hidden,
        t.atoms.border_contrast_medium,
      ]}>
      {link.isLoading ? (
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.py_5xl,
            t.atoms.bg_contrast_25,
          ]}>
          <Loader size="xl" />
        </View>
      ) : link.meta?.error ? (
        <View
          style={[a.justify_center, a.p_md, a.gap_xs, t.atoms.bg_contrast_25]}>
          <Text numberOfLines={1} style={t.atoms.text_contrast_high}>
            {link.uri}
          </Text>
          <Text numberOfLines={2} style={[{color: t.palette.negative_400}]}>
            {link.meta.error}
          </Text>
        </View>
      ) : linkInfo ? (
        <View style={{pointerEvents: 'none'}}>
          <ExternalLinkEmbed link={linkInfo} />
        </View>
      ) : null}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 10,
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

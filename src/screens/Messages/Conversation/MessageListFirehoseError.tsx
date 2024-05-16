import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ConvoItem} from '#/state/messages/convo/types'
import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function MessageListFirehoseError({
  item,
}: {
  item: ConvoItem & {type: 'firehose-error'}
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View style={[a.py_lg, a.align_center]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_sm,
          {maxWidth: 400},
        ]}>
        <CircleInfo
          size="sm"
          fill={t.palette.negative_400}
          style={[{top: 3}]}
        />

        <Text style={[a.leading_snug, a.flex_1, t.atoms.text_contrast_medium]}>
          {_(msg`This chat was disconnected`)} &middot;{' '}
          {item.retry && (
            <InlineLinkText
              to="#"
              label={_(msg`Press to attempt reconnection`)}
              onPress={e => {
                e.preventDefault()
                item.retry?.()
                return false
              }}>
              {_(msg`Reconnect`)}
            </InlineLinkText>
          )}
        </Text>
      </View>
    </View>
  )
}

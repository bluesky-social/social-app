import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ConvoItem, ConvoItemError} from '#/state/messages/convo/types'
import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function MessageListError({item}: {item: ConvoItem & {type: 'error'}}) {
  const t = useTheme()
  const {_} = useLingui()
  const {description, help, cta} = React.useMemo(() => {
    return {
      [ConvoItemError.FirehoseFailed]: {
        description: _(msg`This chat was disconnected`),
        help: _(msg`Press to attempt reconnection`),
        cta: _(msg`Reconnect`),
      },
      [ConvoItemError.HistoryFailed]: {
        description: _(msg`Failed to load past messages`),
        help: _(msg`Press to retry`),
        cta: _(msg`Retry`),
      },
    }[item.code]
  }, [_, item.code])

  return (
    <View style={[a.py_lg, a.align_center]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_sm,
          a.pb_lg,
          {maxWidth: 400},
        ]}>
        <CircleInfo
          size="sm"
          fill={t.palette.negative_400}
          style={[{top: 3}]}
        />

        <Text style={[a.leading_snug, a.flex_1, t.atoms.text_contrast_medium]}>
          {description} &middot;{' '}
          {item.retry && (
            <InlineLinkText
              to="#"
              label={help}
              onPress={e => {
                e.preventDefault()
                item.retry?.()
                return false
              }}>
              {cta}
            </InlineLinkText>
          )}
        </Text>
      </View>
    </View>
  )
}

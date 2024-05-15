import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ConvoItem, ConvoItemError} from '#/state/messages/convo/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Refresh} from '#/components/icons/ArrowRotateCounterClockwise'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'

export function MessageListError({item}: {item: ConvoItem & {type: 'error'}}) {
  const t = useTheme()
  const {_} = useLingui()
  const message = React.useMemo(() => {
    return {
      [ConvoItemError.Unknown]: _(
        msg`An unknown error occurred. If the issue persists, contact support.`,
      ),
      [ConvoItemError.FirehoseFailed]: _(
        msg`This chat was disconnected due to a network error.`,
      ),
      [ConvoItemError.HistoryFailed]: _(msg`Failed to load past messages.`),
      [ConvoItemError.UserBlocked]: _(
        msg`The other user in this chat has blocked you.`,
      ),
    }[item.code]
  }, [_, item.code])

  return (
    <View style={[a.py_lg, a.align_center]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.py_md,
          a.px_lg,
          a.rounded_md,
          t.atoms.bg_contrast_25,
          {maxWidth: 400},
        ]}>
        <View style={[a.flex_row, a.align_start, a.justify_between, a.gap_sm]}>
          <CircleInfo
            size="sm"
            fill={t.palette.negative_400}
            style={[{top: 3}]}
          />
          <View style={[a.flex_1, {maxWidth: 240}]}>
            <Text style={[a.leading_snug]}>{message}</Text>
          </View>
        </View>

        {item.retry && (
          <Button
            label={_(msg`Press to retry`)}
            size="small"
            variant="ghost"
            color="secondary"
            onPress={e => {
              e.preventDefault()
              item.retry?.()
              return false
            }}>
            <ButtonText>{_(msg`Retry`)}</ButtonText>
            <ButtonIcon icon={Refresh} position="right" />
          </Button>
        )}
      </View>
    </View>
  )
}

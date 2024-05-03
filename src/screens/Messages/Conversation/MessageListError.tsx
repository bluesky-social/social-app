import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ConvoItem, ConvoItemError} from '#/state/messages/convo'
import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function MessageListError({
  item,
}: {
  item: ConvoItem & {type: 'error-recoverable'}
}) {
  const t = useTheme()
  const {_} = useLingui()
  const message = React.useMemo(() => {
    return {
      [ConvoItemError.HistoryFailed]: _(msg`Failed to load past messages.`),
      [ConvoItemError.ResumeFailed]: _(
        msg`There was an issue connecting to the chat.`,
      ),
      [ConvoItemError.PollFailed]: _(
        msg`This chat was disconnected due to a network error.`,
      ),
    }[item.code]
  }, [_, item.code])

  return (
    <View style={[a.py_md, a.align_center]}>
      <View
        style={[
          a.align_center,
          a.pt_md,
          a.pb_lg,
          a.px_3xl,
          a.rounded_md,
          t.atoms.bg_contrast_25,
          {maxWidth: 300},
        ]}>
        <CircleInfo size="lg" fill={t.palette.negative_400} />
        <Text style={[a.pt_sm, a.leading_snug]}>
          {message}{' '}
          <InlineLinkText
            to="#"
            label={_(msg`Press to retry`)}
            onPress={e => {
              e.preventDefault()
              item.retry()
              return false
            }}>
            {_(msg`Retry.`)}
          </InlineLinkText>
        </Text>
      </View>
    </View>
  )
}

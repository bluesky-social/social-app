import React, {useCallback} from 'react'
import {StyleProp, TextStyle} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {TimeElapsed} from 'view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function MessageItemMetadata({
  message,
  isLastInGroup,
  style,
}: {
  message: ChatBskyConvoDefs.MessageView
  isLastInGroup: boolean
  style: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const {_} = useLingui()

  const relativeTimestamp = useCallback(
    (timestamp: string) => {
      const date = new Date(timestamp)
      const now = new Date()

      const time = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date)

      const diff = now.getTime() - date.getTime()

      // if under 1 minute
      if (diff < 1000 * 60) {
        return _(msg`Now`)
      }

      // if in the last day
      if (now.toISOString().slice(0, 10) === date.toISOString().slice(0, 10)) {
        return time
      }

      // if yesterday
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (
        yesterday.toISOString().slice(0, 10) === date.toISOString().slice(0, 10)
      ) {
        return _(msg`Yesterday, ${time}`)
      }

      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      }).format(date)
    },
    [_],
  )

  if (!isLastInGroup) {
    return null
  }

  return (
    <TimeElapsed timestamp={message.sentAt} timeToString={relativeTimestamp}>
      {({timeElapsed}) => (
        <Text
          style={[
            t.atoms.text_contrast_medium,
            a.text_xs,
            a.mt_2xs,
            a.mb_lg,
            style,
          ]}>
          {timeElapsed}
        </Text>
      )}
    </TimeElapsed>
  )
}

import React, {useCallback, useMemo} from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {useHaptics} from 'lib/haptics'
import {isNative} from 'platform/detection'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {GrowWrapper, GrowWrapperRef} from '#/components/dms/GrowWrapper'
import {MessageMenu} from '#/components/dms/MessageMenu'
import {Text} from '#/components/Typography'

export function MessageItem({
  item,
  next,
}: {
  item: ChatBskyConvoDefs.MessageView
  next:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null
}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const playHaptic = useHaptics()

  const control = useDialogControl()
  const itemRef = React.useRef<GrowWrapperRef>(null)

  const isFromSelf = item.sender?.did === currentAccount?.did

  const isNextFromSelf =
    ChatBskyConvoDefs.isMessageView(next) &&
    next.sender?.did === currentAccount?.did

  const isLastInGroup = useMemo(() => {
    // if the next message is from a different sender, then it's the last in the group
    if (isFromSelf ? !isNextFromSelf : isNextFromSelf) {
      return true
    }

    // or, if there's a 10 minute gap between this message and the next
    if (ChatBskyConvoDefs.isMessageView(next)) {
      const thisDate = new Date(item.sentAt)
      const nextDate = new Date(next.sentAt)

      const diff = nextDate.getTime() - thisDate.getTime()

      // 10 minutes
      return diff > 10 * 60 * 1000
    }

    return true
  }, [item, next, isFromSelf, isNextFromSelf])

  const onOpenMenu = React.useCallback(() => {
    if (isNative) {
      playHaptic()
    }
    control.open()
  }, [control, playHaptic])

  return (
    <View
      style={{maxWidth: '65%', marginLeft: isFromSelf ? 'auto' : undefined}}>
      <GrowWrapper onOpenMenu={onOpenMenu} ref={itemRef}>
        <View
          style={[
            a.py_sm,
            a.px_lg,
            a.my_2xs,
            a.rounded_md,
            {
              backgroundColor: isFromSelf
                ? t.palette.primary_500
                : t.palette.contrast_50,
              borderRadius: 17,
            },
            isFromSelf
              ? {borderBottomRightRadius: isLastInGroup ? 2 : 17}
              : {borderBottomLeftRadius: isLastInGroup ? 2 : 17},
          ]}>
          <Text
            style={[
              a.text_md,
              a.leading_snug,
              isFromSelf && {color: t.palette.white},
            ]}>
            {item.text}
          </Text>
        </View>
        <Metadata
          message={item}
          isLastInGroup={isLastInGroup}
          style={isFromSelf ? a.text_right : a.text_left}
        />
        <MessageMenu
          message={item}
          onClose={() => itemRef.current?.reset()}
          control={control}
        />
      </GrowWrapper>
    </View>
  )
}

function Metadata({
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
            a.mt_xs,
            a.mb_lg,
            style,
          ]}>
          {timeElapsed}
        </Text>
      )}
    </TimeElapsed>
  )
}

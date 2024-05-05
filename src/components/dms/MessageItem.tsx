import React, {useCallback, useMemo, useRef} from 'react'
import {LayoutAnimation, StyleProp, TextStyle, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {TimeElapsed} from 'view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {ActionsWrapper} from '#/components/dms/ActionsWrapper'
import {Text} from '#/components/Typography'

export let MessageItem = ({
  item,
  next,
  pending,
}: {
  item: ChatBskyConvoDefs.MessageView
  next:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null
  pending?: boolean
}): React.ReactNode => {
  const t = useTheme()
  const {currentAccount} = useSession()

  const isFromSelf = item.sender?.did === currentAccount?.did

  const isNextFromSelf =
    ChatBskyConvoDefs.isMessageView(next) &&
    next.sender?.did === currentAccount?.did

  const isLastInGroup = useMemo(() => {
    // TODO this means it's a placeholder. Let's figure out the right way to do this though!
    if (item.id.length > 13) {
      return false
    }

    // if the next message is from a different sender, then it's the last in the group
    if (isFromSelf ? !isNextFromSelf : isNextFromSelf) {
      return true
    }

    // or, if there's a 3 minute gap between this message and the next
    if (ChatBskyConvoDefs.isMessageView(next)) {
      const thisDate = new Date(item.sentAt)
      const nextDate = new Date(next.sentAt)

      const diff = nextDate.getTime() - thisDate.getTime()

      // 3 minutes
      return diff > 3 * 60 * 1000
    }

    return true
  }, [item, next, isFromSelf, isNextFromSelf])

  const lastInGroupRef = useRef(isLastInGroup)
  if (lastInGroupRef.current !== isLastInGroup) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    lastInGroupRef.current = isLastInGroup
  }

  const pendingColor =
    t.name === 'light' ? t.palette.primary_200 : t.palette.primary_800

  return (
    <View>
      <ActionsWrapper isFromSelf={isFromSelf} message={item}>
        <View
          style={[
            a.py_sm,
            a.my_2xs,
            a.rounded_md,
            {
              paddingLeft: 14,
              paddingRight: 14,
              backgroundColor: isFromSelf
                ? pending
                  ? pendingColor
                  : t.palette.primary_500
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
              pending && t.name !== 'light' && {color: t.palette.primary_300},
            ]}>
            {item.text}
          </Text>
        </View>
      </ActionsWrapper>
      <MessageItemMetadata
        message={item}
        isLastInGroup={isLastInGroup}
        style={isFromSelf ? a.text_right : a.text_left}
      />
    </View>
  )
}

MessageItem = React.memo(MessageItem)

let MessageItemMetadata = ({
  message,
  isLastInGroup,
  style,
}: {
  message: ChatBskyConvoDefs.MessageView
  isLastInGroup: boolean
  style: StyleProp<TextStyle>
}): React.ReactNode => {
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
      if (localDateString(now) === localDateString(date)) {
        return time
      }

      // if yesterday
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      if (localDateString(yesterday) === localDateString(date)) {
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

MessageItemMetadata = React.memo(MessageItemMetadata)

function localDateString(date: Date) {
  // can't use toISOString because it should be in local time
  const mm = date.getMonth()
  const dd = date.getDate()
  const yyyy = date.getFullYear()
  // not padding with 0s because it's not necessary, it's just used for comparison
  return `${yyyy}-${mm}-${dd}`
}

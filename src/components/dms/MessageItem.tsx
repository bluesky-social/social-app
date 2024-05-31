import React, {useCallback, useMemo, useRef} from 'react'
import {
  GestureResponderEvent,
  LayoutAnimation,
  StyleProp,
  TextStyle,
  View,
} from 'react-native'
import {
  AppBskyEmbedRecord,
  ChatBskyConvoDefs,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ConvoItem} from '#/state/messages/convo/types'
import {useSession} from '#/state/session'
import {TimeElapsed} from 'view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {ActionsWrapper} from '#/components/dms/ActionsWrapper'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {isOnlyEmoji, RichText} from '../RichText'
import {MessageItemEmbed} from './MessageItemEmbed'

let MessageItem = ({
  item,
}: {
  item: ConvoItem & {type: 'message' | 'pending-message'}
}): React.ReactNode => {
  const t = useTheme()
  const {currentAccount} = useSession()

  const {message, nextMessage} = item
  const isPending = item.type === 'pending-message'

  const isFromSelf = message.sender?.did === currentAccount?.did

  const isNextFromSelf =
    ChatBskyConvoDefs.isMessageView(nextMessage) &&
    nextMessage.sender?.did === currentAccount?.did

  const isLastInGroup = useMemo(() => {
    // if this message is pending, it means the next message is pending too
    if (isPending && nextMessage) {
      return false
    }

    // if the next message is from a different sender, then it's the last in the group
    if (isFromSelf ? !isNextFromSelf : isNextFromSelf) {
      return true
    }

    // or, if there's a 3 minute gap between this message and the next
    if (ChatBskyConvoDefs.isMessageView(nextMessage)) {
      const thisDate = new Date(message.sentAt)
      const nextDate = new Date(nextMessage.sentAt)

      const diff = nextDate.getTime() - thisDate.getTime()

      // 3 minutes
      return diff > 3 * 60 * 1000
    }

    return true
  }, [message, nextMessage, isFromSelf, isNextFromSelf, isPending])

  const lastInGroupRef = useRef(isLastInGroup)
  if (lastInGroupRef.current !== isLastInGroup) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    lastInGroupRef.current = isLastInGroup
  }

  const pendingColor =
    t.name === 'light' ? t.palette.primary_200 : t.palette.primary_800

  const rt = useMemo(() => {
    return new RichTextAPI({text: message.text, facets: message.facets})
  }, [message.text, message.facets])

  return (
    <View style={[isFromSelf ? a.mr_md : a.ml_md]}>
      <ActionsWrapper isFromSelf={isFromSelf} message={message}>
        {AppBskyEmbedRecord.isView(message.embed) && (
          <MessageItemEmbed embed={message.embed} />
        )}
        {rt.text.length > 0 && (
          <View
            style={
              !isOnlyEmoji(message.text) && [
                a.py_sm,
                a.my_2xs,
                a.rounded_md,
                {
                  paddingLeft: 14,
                  paddingRight: 14,
                  backgroundColor: isFromSelf
                    ? isPending
                      ? pendingColor
                      : t.palette.primary_500
                    : t.palette.contrast_50,
                  borderRadius: 17,
                },
                isFromSelf ? a.self_end : a.self_start,
                isFromSelf
                  ? {borderBottomRightRadius: isLastInGroup ? 2 : 17}
                  : {borderBottomLeftRadius: isLastInGroup ? 2 : 17},
              ]
            }>
            <RichText
              value={rt}
              style={[
                a.text_md,
                isFromSelf && {color: t.palette.white},
                isPending &&
                  t.name !== 'light' && {color: t.palette.primary_300},
              ]}
              interactiveStyle={a.underline}
              enableTags
              emojiMultiplier={3}
            />
          </View>
        )}
      </ActionsWrapper>

      {isLastInGroup && (
        <MessageItemMetadata
          item={item}
          style={isFromSelf ? a.text_right : a.text_left}
        />
      )}
    </View>
  )
}
MessageItem = React.memo(MessageItem)
export {MessageItem}

let MessageItemMetadata = ({
  item,
  style,
}: {
  item: ConvoItem & {type: 'message' | 'pending-message'}
  style: StyleProp<TextStyle>
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {message} = item

  const handleRetry = useCallback(
    (e: GestureResponderEvent) => {
      if (item.type === 'pending-message' && item.retry) {
        e.preventDefault()
        item.retry()
        return false
      }
    },
    [item],
  )

  const relativeTimestamp = useCallback(
    (timestamp: string) => {
      const date = new Date(timestamp)
      const now = new Date()

      const time = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
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
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      }).format(date)
    },
    [_],
  )

  return (
    <Text
      style={[
        a.text_xs,
        a.mt_2xs,
        a.mb_lg,
        t.atoms.text_contrast_medium,
        style,
      ]}>
      <TimeElapsed timestamp={message.sentAt} timeToString={relativeTimestamp}>
        {({timeElapsed}) => (
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {timeElapsed}
          </Text>
        )}
      </TimeElapsed>

      {item.type === 'pending-message' && item.failed && (
        <>
          {' '}
          &middot;{' '}
          <Text
            style={[
              a.text_xs,
              {
                color: t.palette.negative_400,
              },
            ]}>
            {_(msg`Failed to send`)}
          </Text>
          {item.retry && (
            <>
              {' '}
              &middot;{' '}
              <InlineLinkText
                label={_(msg`Click to retry failed message`)}
                to="#"
                onPress={handleRetry}
                style={[a.text_xs]}>
                {_(msg`Retry`)}
              </InlineLinkText>
            </>
          )}
        </>
      )}
    </Text>
  )
}

MessageItemMetadata = React.memo(MessageItemMetadata)
export {MessageItemMetadata}

function localDateString(date: Date) {
  // can't use toISOString because it should be in local time
  const mm = date.getMonth()
  const dd = date.getDate()
  const yyyy = date.getFullYear()
  // not padding with 0s because it's not necessary, it's just used for comparison
  return `${yyyy}-${mm}-${dd}`
}

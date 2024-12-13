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
import {I18n} from '@lingui/core'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ConvoItem} from '#/state/messages/convo/types'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {ActionsWrapper} from '#/components/dms/ActionsWrapper'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {RichText} from '../RichText'
import {DateDivider} from './DateDivider'
import {MessageItemEmbed} from './MessageItemEmbed'
import {localDateString} from './util'

let MessageItem = ({
  item,
}: {
  item: ConvoItem & {type: 'message' | 'pending-message'}
}): React.ReactNode => {
  const t = useTheme()
  const {currentAccount} = useSession()

  const {message, nextMessage, prevMessage} = item
  const isPending = item.type === 'pending-message'

  const isFromSelf = message.sender?.did === currentAccount?.did

  const nextIsMessage = ChatBskyConvoDefs.isMessageView(nextMessage)

  const isNextFromSelf =
    nextIsMessage && nextMessage.sender?.did === currentAccount?.did

  const isNextFromSameSender = isNextFromSelf === isFromSelf

  const isNewDay = useMemo(() => {
    if (!prevMessage) return true

    const thisDate = new Date(message.sentAt)
    const prevDate = new Date(prevMessage.sentAt)

    return localDateString(thisDate) !== localDateString(prevDate)
  }, [message, prevMessage])

  const isLastMessageOfDay = useMemo(() => {
    if (!nextMessage || !nextIsMessage) return true

    const thisDate = new Date(message.sentAt)
    const prevDate = new Date(nextMessage.sentAt)

    return localDateString(thisDate) !== localDateString(prevDate)
  }, [message.sentAt, nextIsMessage, nextMessage])

  const needsTail = isLastMessageOfDay || !isNextFromSameSender

  const isLastInGroup = useMemo(() => {
    // if this message is pending, it means the next message is pending too
    if (isPending && nextMessage) {
      return false
    }

    // or, if there's a 5 minute gap between this message and the next
    if (ChatBskyConvoDefs.isMessageView(nextMessage)) {
      const thisDate = new Date(message.sentAt)
      const nextDate = new Date(nextMessage.sentAt)

      const diff = nextDate.getTime() - thisDate.getTime()

      // 5 minutes
      return diff > 5 * 60 * 1000
    }

    return true
  }, [message, nextMessage, isPending])

  const lastInGroupRef = useRef(isLastInGroup)
  if (lastInGroupRef.current !== isLastInGroup) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    lastInGroupRef.current = isLastInGroup
  }

  const pendingColor = t.palette.primary_200

  const rt = useMemo(() => {
    return new RichTextAPI({text: message.text, facets: message.facets})
  }, [message.text, message.facets])

  return (
    <>
      {isNewDay && <DateDivider date={message.sentAt} />}
      <View
        style={[
          isFromSelf ? a.mr_md : a.ml_md,
          nextIsMessage && !isNextFromSameSender && a.mb_md,
        ]}>
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
                    ? {borderBottomRightRadius: needsTail ? 2 : 17}
                    : {borderBottomLeftRadius: needsTail ? 2 : 17},
                ]
              }>
              <RichText
                value={rt}
                style={[a.text_md, isFromSelf && {color: t.palette.white}]}
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
    </>
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
    (i18n: I18n, timestamp: string) => {
      const date = new Date(timestamp)
      const now = new Date()

      const time = i18n.date(date, {
        hour: 'numeric',
        minute: 'numeric',
      })

      const diff = now.getTime() - date.getTime()

      // if under 30 seconds
      if (diff < 1000 * 30) {
        return _(msg`Now`)
      }

      return time
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

import {memo, useCallback, useMemo} from 'react'
import {
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  View,
} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {
  AppBskyEmbedRecord,
  ChatBskyConvoDefs,
  RichText as RichTextAPI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useConvoActive} from '#/state/messages/convo'
import {type ConvoItem} from '#/state/messages/convo/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {atoms as a, native, useTheme} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {ActionsWrapper} from '#/components/dms/ActionsWrapper'
import {InlineLinkText} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {DateDivider} from './DateDivider'
import {MessageItemEmbed} from './MessageItemEmbed'

const AVATAR_SIZE = 28
const CLUSTERED_MESSAGE_GAP = 2
const BORDER_RADIUS = 18
const SQUARED_BORDER_RADIUS = 4
const DISPLAY_NAME_INSET = 22

const CLUSTERED_MESSAGE_THRESHOLD_MS = 5 * 60 * 1000
const MESSAGE_GAP_THRESHOLD_MS = 60 * 60 * 1000

function isWithinCluster({
  isPending,
  adjacentMessage,
  isFromSameSender,
  currentSentAt,
  direction,
}: {
  isPending: boolean
  adjacentMessage:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null
  isFromSameSender: boolean
  currentSentAt: string
  direction: 'prev' | 'next'
}): boolean {
  if (!isFromSameSender) return true
  if (isPending && adjacentMessage) return false
  if (ChatBskyConvoDefs.isMessageView(adjacentMessage)) {
    const thisDate = new Date(currentSentAt)
    const adjDate = new Date(adjacentMessage.sentAt)
    const diff =
      direction === 'next'
        ? adjDate.getTime() - thisDate.getTime()
        : thisDate.getTime() - adjDate.getTime()
    return diff > CLUSTERED_MESSAGE_THRESHOLD_MS
  }
  return true
}

let MessageItem = ({
  item,
  isGroupChat = false,
  profile,
}: {
  item: ConvoItem & {type: 'message' | 'pending-message'}
  isGroupChat?: boolean
  profile?: bsky.profile.AnyProfileView
}): React.ReactNode => {
  const t = useTheme()
  const {currentAccount} = useSession()
  const {t: l} = useLingui()
  const {convo} = useConvoActive()
  const moderationOpts = useModerationOpts()

  const {message, nextMessage, prevMessage} = item
  const isPending = item.type === 'pending-message'

  const displayName = sanitizeDisplayName(
    profile?.displayName || sanitizeHandle(profile?.handle ?? ''),
  )

  const isFromSelf = message.sender?.did === currentAccount?.did

  const prevIsMessage = ChatBskyConvoDefs.isMessageView(prevMessage)
  const nextIsMessage = ChatBskyConvoDefs.isMessageView(nextMessage)

  const isPrevFromSameSender =
    prevIsMessage && prevMessage.sender?.did === message.sender?.did
  const isNextFromSameSender =
    nextIsMessage && nextMessage.sender?.did === message.sender?.did

  const isFirstInCluster = useMemo(
    () =>
      isWithinCluster({
        isPending,
        adjacentMessage: prevMessage,
        isFromSameSender: isPrevFromSameSender,
        currentSentAt: message.sentAt,
        direction: 'prev',
      }),
    [isPending, prevMessage, isPrevFromSameSender, message.sentAt],
  )

  const isLastInCluster = useMemo(
    () =>
      isWithinCluster({
        isPending,
        adjacentMessage: nextMessage,
        isFromSameSender: isNextFromSameSender,
        currentSentAt: message.sentAt,
        direction: 'next',
      }),
    [isPending, nextMessage, isNextFromSameSender, message.sentAt],
  )

  const hasLargeGapFromPrev =
    !ChatBskyConvoDefs.isMessageView(prevMessage) ||
    new Date(message.sentAt).getTime() -
      new Date(prevMessage.sentAt).getTime() >
      MESSAGE_GAP_THRESHOLD_MS

  const showDateDivider = hasLargeGapFromPrev

  const isInCluster = !(isFirstInCluster && isLastInCluster)
  const isInMiddleOfCluster =
    isInCluster && !isFirstInCluster && !isLastInCluster

  const hasReactions = message.reactions && message.reactions.length > 0
  const squaredBottomCorner =
    !hasReactions && isInCluster && (isInMiddleOfCluster || isFirstInCluster)
  const squaredTopCorner =
    isInCluster && (isInMiddleOfCluster || isLastInCluster)

  const pendingColor = t.palette.primary_300

  const rt = useMemo(() => {
    return new RichTextAPI({text: message.text, facets: message.facets})
  }, [message.text, message.facets])

  const hasEmbedAndText =
    AppBskyEmbedRecord.isView(message.embed) && rt.text.length > 0

  const avatar = profile ? (
    <ProfileCard.Avatar
      profile={profile}
      size={AVATAR_SIZE}
      moderationOpts={moderationOpts!}
      disabledPreview
    />
  ) : (
    <ProfileCard.AvatarPlaceholder size={AVATAR_SIZE} />
  )

  const groupedReactions = useMemo(() => {
    const reactions = message.reactions ?? []
    const grouped = new Map<
      string,
      {
        value: string
        senders: ChatBskyConvoDefs.ReactionViewSender[]
        count: number
      }
    >()
    for (const react of reactions) {
      if (!react) continue
      const existing = grouped.get(react.value)
      if (existing) {
        existing.senders.push(react.sender)
        existing.count++
      } else {
        grouped.set(react.value, {
          value: react.value,
          senders: [react.sender],
          count: 1,
        })
      }
    }
    return Array.from(grouped.values())
  }, [message.reactions])

  const reactions = useMemo(() => message.reactions ?? [], [message.reactions])

  const reactionsLabel = useMemo(() => {
    if (reactions.length === 0) return ''
    if (reactions.length === 1) {
      const reaction = reactions[0]
      const sender = reaction.sender
      if (sender.did === currentAccount?.did) {
        return l`You reacted ${reaction.value}`
      } else {
        const senderDid = reaction.sender.did
        const sender = convo.members.find(member => member.did === senderDid)
        if (sender) {
          return l`${sanitizeDisplayName(
            sender.displayName || sender.handle,
          )} reacted ${reaction.value}`
        }
        return l`Someone reacted ${reaction.value}`
      }
    }
    return l`${plural(reactions.length, {
      one: '# person',
      other: '# people',
    })} reacted – ${groupedReactions.map(g => g.value).join(' ')}`
  }, [reactions, groupedReactions, currentAccount?.did, convo.members, l])

  const appliedReactions = (
    <LayoutAnimationConfig skipEntering skipExiting>
      {hasReactions ? (
        <View
          style={[
            isFromSelf ? a.align_end : a.align_start,
            a.px_sm,
            a.pb_2xs,
            !isFromSelf && isGroupChat && {paddingLeft: AVATAR_SIZE},
          ]}>
          <View
            accessible={true}
            accessibilityLabel={reactionsLabel}
            accessibilityHint={l`Double tap or long press the message to add a reaction`}
            style={[
              a.flex_row,
              a.gap_2xs,
              a.py_xs,
              a.px_xs,
              isFromSelf ? a.justify_end : a.justify_start,
              a.flex_wrap,
              a.rounded_lg,
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_25,
              t.atoms.shadow_sm,
              {
                transform: [{translateY: -8}],
              },
            ]}>
            {groupedReactions.map(group => (
              <Animated.View
                entering={native(ZoomIn.springify(200).delay(400))}
                exiting={
                  groupedReactions.length > 1 && native(ZoomOut.delay(200))
                }
                layout={native(LinearTransition.delay(300))}
                key={group.value}
                style={[a.p_2xs]}>
                <Text emoji style={[a.text_sm]}>
                  {group.value}
                </Text>
              </Animated.View>
            ))}
            {groupedReactions.length !== reactions.length &&
            reactions.length > 1 ? (
              <View style={[a.p_2xs, a.justify_center]}>
                <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                  {reactions.length}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </LayoutAnimationConfig>
  )

  return (
    <>
      {showDateDivider && (
        <Animated.View entering={native(FadeIn)} exiting={native(FadeOut)}>
          <DateDivider date={message.sentAt} />
        </Animated.View>
      )}
      <View
        style={[
          isFromSelf ? a.mr_sm : a.ml_sm,
          isFirstInCluster && !showDateDivider && a.mt_sm,
        ]}>
        <View style={[a.relative]}>
          {isGroupChat && !isFromSelf && isLastInCluster ? (
            <View style={[a.absolute, a.bottom_0]}>{avatar}</View>
          ) : null}
          <View
            style={[
              a.flex_grow,
              !isFromSelf &&
                isGroupChat && {
                  paddingLeft: AVATAR_SIZE,
                },
            ]}>
            {isGroupChat &&
            !isFromSelf &&
            isFirstInCluster &&
            !isOnlyEmoji(message.text) ? (
              <Text
                style={[
                  a.text_xs,
                  t.atoms.text_contrast_medium,
                  a.pt_xs,
                  a.pb_2xs,
                  {
                    paddingLeft: DISPLAY_NAME_INSET,
                  },
                ]}>
                {displayName}
              </Text>
            ) : null}
            <ActionsWrapper isFromSelf={isFromSelf} message={message}>
              {rt.text.length > 0 && (
                <View
                  style={[
                    !isFromSelf && a.ml_sm,
                    ...(isOnlyEmoji(message.text)
                      ? []
                      : [
                          a.rounded_md,
                          a.rounded_xl,
                          a.py_sm,
                          a.px_md,
                          {
                            marginTop: isFirstInCluster
                              ? 0
                              : CLUSTERED_MESSAGE_GAP,
                            backgroundColor: isFromSelf
                              ? isPending
                                ? pendingColor
                                : t.palette.primary_500
                              : t.palette.contrast_50,
                          },
                          isFromSelf ? a.self_end : a.self_start,
                          isFromSelf
                            ? {
                                borderBottomRightRadius:
                                  squaredBottomCorner || hasEmbedAndText
                                    ? SQUARED_BORDER_RADIUS
                                    : BORDER_RADIUS,
                                borderTopRightRadius: squaredTopCorner
                                  ? SQUARED_BORDER_RADIUS
                                  : BORDER_RADIUS,
                              }
                            : {
                                borderBottomLeftRadius:
                                  squaredBottomCorner || hasEmbedAndText
                                    ? SQUARED_BORDER_RADIUS
                                    : BORDER_RADIUS,
                                borderTopLeftRadius: squaredTopCorner
                                  ? SQUARED_BORDER_RADIUS
                                  : BORDER_RADIUS,
                              },
                        ]),
                  ]}>
                  <RichText
                    value={rt}
                    style={[a.text_md, isFromSelf && {color: t.palette.white}]}
                    interactiveStyle={a.underline}
                    enableTags
                    emojiMultiplier={3}
                    shouldProxyLinks={true}
                  />
                </View>
              )}
              {AppBskyEmbedRecord.isView(message.embed) && (
                <MessageItemEmbed
                  embed={message.embed}
                  isFromSelf={isFromSelf}
                  squaredBottomCorner={squaredBottomCorner}
                  squaredTopCorner={squaredTopCorner || hasEmbedAndText}
                />
              )}
            </ActionsWrapper>
          </View>
        </View>
        {appliedReactions}
        {isLastInCluster && (
          <MessageItemMetadata
            item={item}
            style={[isFromSelf ? a.text_right : a.text_left]}
          />
        )}
      </View>
    </>
  )
}
MessageItem = memo(MessageItem)
export {MessageItem}

let MessageItemMetadata = ({
  item,
  style,
}: {
  item: ConvoItem & {type: 'message' | 'pending-message'}
  style: StyleProp<TextStyle>
}): React.ReactNode => {
  const t = useTheme()
  const {t: l} = useLingui()

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

  const errorColor = t.palette.negative_400

  switch (item.type) {
    case 'pending-message':
      return item.failed ? (
        <Text
          style={[
            a.text_xs,
            a.my_2xs,
            {
              color: errorColor,
            },
            style,
          ]}>
          <Text
            style={[
              a.text_xs,
              {
                color: errorColor,
              },
            ]}>
            {l`Message failed to send.`}
          </Text>
          {item.retry && (
            <>
              {' '}
              <InlineLinkText
                label={l`Click to retry failed message`}
                to="#"
                onPress={handleRetry}
                style={[
                  a.text_xs,
                  {
                    color: errorColor,
                  },
                ]}>
                {l`Tap to retry`}
              </InlineLinkText>
              .
            </>
          )}
        </Text>
      ) : (
        <Text
          style={[
            a.text_xs,
            a.my_2xs,
            style,
            t.atoms.text_contrast_high,
          ]}>{l`Sending…`}</Text>
      )
    default:
      return null
  }
}
MessageItemMetadata = memo(MessageItemMetadata)
export {MessageItemMetadata}

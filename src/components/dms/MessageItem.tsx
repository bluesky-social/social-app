import {memo, useCallback, useMemo, useState} from 'react'
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  type TextStyle,
  View,
} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  useSharedValue,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {
  AppBskyEmbedRecord,
  ChatBskyConvoDefs,
  RichText as RichTextAPI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useConvoActive} from '#/state/messages/convo'
import {type ConvoItem} from '#/state/messages/convo/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {DraggableScrollView} from '#/view/com/pager/DraggableScrollView'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
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

// 42px avatar + 2 * 8px my_sm margins
const ROW_HEIGHT = 58

const CLUSTERED_MESSAGE_THRESHOLD_MS = 5 * 60 * 1000
const MESSAGE_GAP_THRESHOLD_MS = 60 * 60 * 1000

type Reaction = {
  key: string
  value: string
  senders: ChatBskyConvoDefs.ReactionViewSender[]
  count: number
}

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

  const reactionsControl = useDialogControl()

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
        key: string
        value: string
        senders: ChatBskyConvoDefs.ReactionViewSender[]
        count: number
      }
    >()
    for (const reaction of reactions) {
      if (!reaction) continue
      const existing = grouped.get(reaction.value)
      if (existing) {
        existing.senders.push(reaction.sender)
        existing.count++
      } else {
        grouped.set(reaction.value, {
          key: reaction.value,
          value: reaction.value,
          senders: [reaction.sender],
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
        <>
          <View
            style={[
              isFromSelf ? a.align_end : a.align_start,
              a.px_sm,
              a.pb_2xs,
            ]}>
            <Pressable
              accessible={true}
              accessibilityLabel={reactionsLabel}
              accessibilityHint={
                isGroupChat ? l`Tap to view reactions` : undefined
              }
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
              ]}
              onPress={() =>
                isGroupChat ? reactionsControl.open() : undefined
              }>
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
                  <Text
                    style={[
                      a.text_xs,
                      t.atoms.text_contrast_medium,
                      {includeFontPadding: false},
                    ]}>
                    {reactions.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          <ReactionsDialog
            control={reactionsControl}
            members={convo.members}
            reactions={message.reactions}
            groupedReactions={groupedReactions}
          />
        </>
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
            <View style={[a.absolute, {bottom: hasReactions ? 10 : 0}]}>
              {avatar}
            </View>
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
                  accessibilityHint={l`Double tap or long press the message to add a reaction`}
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
              {appliedReactions}
            </ActionsWrapper>
          </View>
        </View>
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
        <Text style={[a.text_xs, a.my_2xs, {color: errorColor}, style]}>
          <Text style={[a.text_xs, {color: errorColor}]}>
            <Trans>Message failed to send.</Trans>
          </Text>
          {item.retry && (
            <>
              {' '}
              <InlineLinkText
                label={l`Click to retry failed message`}
                to="#"
                onPress={handleRetry}
                style={[a.text_xs, {color: errorColor}]}>
                <Trans>Tap to retry</Trans>
              </InlineLinkText>
              .
            </>
          )}
        </Text>
      ) : null
    default:
      return null
  }
}
MessageItemMetadata = memo(MessageItemMetadata)
export {MessageItemMetadata}

function ReactionsDialog({
  control,
  members,
  reactions,
  groupedReactions,
}: {
  control: Dialog.DialogControlProps
  members: bsky.profile.AnyProfileView[]
  reactions?: ChatBskyConvoDefs.ReactionView[]
  groupedReactions?: Reaction[]
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const [selected, setSelected] = useState('all')

  const handleFilter = (value: string) => {
    setSelected(value)
  }

  const filteredMembers =
    selected === 'all'
      ? members
      : members.filter(m =>
          reactions?.some(r => r.sender.did === m.did && r.value === selected),
        )

  const minHeight = members.length * ROW_HEIGHT

  return (
    <Dialog.Outer
      control={control}
      onClose={() => setSelected('all')}
      nativeOptions={{preventExpansion: true, minHeight}}>
      <Dialog.Handle />
      <View style={[a.px_2xl, a.pt_3xl, t.atoms.bg]}>
        <Text style={[a.font_bold, a.text_2xl, a.mb_sm]}>
          <Trans>Reactions</Trans>
        </Text>
      </View>
      <ReactionTabs
        groupedReactions={groupedReactions}
        selected={selected}
        totalReactions={reactions?.length ?? 0}
        onFilter={handleFilter}
      />
      <Dialog.ScrollableInner
        label={l`Reactions`}
        contentContainerStyle={[a.pt_0]}
        style={[web({maxWidth: 400})]}>
        {filteredMembers.map(profile => {
          const displayName = sanitizeDisplayName(
            profile?.displayName || sanitizeHandle(profile?.handle ?? ''),
          )
          const handle = sanitizeHandle(profile?.handle ?? '', '@')
          const reaction = reactions?.find(
            ({sender}) => sender.did === profile.did,
          )
          const rt = reaction
            ? new RichTextAPI({text: reaction.value})
            : undefined

          return rt ? (
            <View
              key={profile.did}
              style={[
                a.flex_row,
                a.gap_sm,
                a.align_center,
                a.justify_between,
                a.my_sm,
              ]}>
              <View style={[a.flex_row, a.gap_sm]}>
                <UserAvatar
                  avatar={profile.avatar}
                  size={42}
                  type="user"
                  hideLiveBadge
                />
                <View>
                  <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                    {displayName}
                  </Text>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    {handle}
                  </Text>
                </View>
              </View>
              <View>
                <RichText
                  value={rt}
                  style={[a.text_md]}
                  interactiveStyle={a.underline}
                  enableTags
                  emojiMultiplier={2}
                  shouldProxyLinks={true}
                />
              </View>
            </View>
          ) : null
        })}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function ReactionTabs({
  groupedReactions,
  selected,
  totalReactions,
  onFilter,
}: {
  groupedReactions?: Reaction[]
  selected: string
  totalReactions: number
  onFilter: (value: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const contentSize = useSharedValue(0)
  const scrollX = useSharedValue(0)

  const handlePress = (value: string) => {
    onFilter(value)
  }

  const tabs = [
    {
      key: 'all',
      value: l`All`,
      senders: [],
      count: totalReactions,
    } as Reaction,
    ...(groupedReactions ?? []),
  ]

  return (
    <View accessibilityRole="list" style={[t.atoms.bg]}>
      <DraggableScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onScroll={e => {
          scrollX.set(Math.round(e.nativeEvent.contentOffset.x))
        }}>
        <Animated.View
          style={[
            a.flex_row,
            a.flex_grow,
            a.gap_sm,
            a.align_center,
            a.justify_start,
          ]}
          onLayout={e => {
            contentSize.set(e.nativeEvent.layout.width)
          }}>
          {tabs?.map((reaction, index) => (
            <ReactionTab
              key={reaction.value}
              index={index}
              reaction={reaction}
              selected={selected}
              total={tabs.length}
              onPress={handlePress}
            />
          ))}
        </Animated.View>
      </DraggableScrollView>
    </View>
  )
}

function ReactionTab({
  index,
  reaction,
  selected,
  total,
  onPress,
}: {
  index: number
  reaction: Reaction
  selected: string
  total: number
  onPress: (value: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={
        reaction.key === 'all'
          ? l`Tap to show all reactions `
          : l`Tap to show ${reaction.value} reactions`
      }
      hitSlop={HITSLOP_10}
      style={[
        a.flex_row,
        a.align_center,
        a.border,
        a.justify_center,
        a.rounded_lg,
        a.px_md,
        a.py_sm,
        a.mb_sm,
        t.atoms.border_contrast_low,
        selected === reaction.key ? t.atoms.bg_contrast_50 : t.atoms.bg,
        index === 0 ? a.ml_2xl : index === total - 1 ? a.mr_2xl : null,
      ]}
      onPress={() => onPress(reaction.key)}>
      <Text emoji style={[a.text_sm]}>
        {l`${reaction.value} ${reaction.count}`}
      </Text>
    </Pressable>
  )
}

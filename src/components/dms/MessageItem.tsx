import {memo, useEffect, useMemo} from 'react'
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {
  AppBskyEmbedRecord,
  type ChatBskyActorDefs,
  ChatBskyConvoDefs,
  ChatBskyEmbedJoinLink,
  moderateProfile,
  RichText as RichTextAPI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {isBlockedOrBlocking} from '#/lib/moderation/blocked-and-muted'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {type Shadow} from '#/state/cache/types'
import {type ConvoItem} from '#/state/messages/convo/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useSession} from '#/state/session'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, platform, tokens, useTheme, utils} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {Button} from '#/components/Button'
import {ActionsWrapper} from '#/components/dms/ActionsWrapper'
import {useMessageDialogs} from '#/components/dms/MessageOverlays'
import {useMessageReplies} from '#/components/dms/MessageReplies'
import {useReplyPreviewText} from '#/components/dms/replyPreview'
import {ArrowCornerDownRight_Stroke2_Corner3_Rounded as ArrowCornerDownRightIcon} from '#/components/icons/ArrowCornerDownRight'
import {InlineLinkText} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {DateDivider} from './DateDivider'
import {MessageItemEmbed} from './MessageItemEmbed'
import {MessageItemInviteEmbed} from './MessageItemInviteEmbed'
import {groupReactions} from './ReactionsDialog'
import {
  CLUSTERED_MESSAGE_THRESHOLD_MS,
  filterBlockedReactions,
  MESSAGE_BUBBLE_MAX_WIDTH,
  MESSAGE_GAP_THRESHOLD_MS,
} from './util'

const AVATAR_SIZE = 28
const CLUSTERED_MESSAGE_GAP = 2
const BORDER_RADIUS = 20
const SQUARED_BORDER_RADIUS = 4
const DISPLAY_NAME_INSET = 20

function messageIsReply(
  message:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null,
): boolean {
  return (
    ChatBskyConvoDefs.isMessageView(message) &&
    (ChatBskyConvoDefs.isMessageView(message.replyTo) ||
      ChatBskyConvoDefs.isDeletedMessageView(message.replyTo))
  )
}

function isWithinClusterBoundary({
  isPending,
  message,
  adjacentMessage,
  isFromSameSender,
  direction,
}: {
  isPending: boolean
  message: ChatBskyConvoDefs.MessageView
  adjacentMessage:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null
  isFromSameSender: boolean
  direction: 'prev' | 'next'
}): boolean {
  // A reply always starts its own cluster, breaking grouping with the message
  // above it. Looking back, that's a boundary if this message is a reply;
  // looking forward, it's a boundary if the next message is a reply.
  if (messageIsReply(direction === 'prev' ? message : adjacentMessage)) {
    return true
  }
  if (!isFromSameSender) return true
  if (ChatBskyConvoDefs.isMessageView(adjacentMessage)) {
    const currentSentAt = message.sentAt
    const thisDate = new Date(currentSentAt)
    const adjDate = new Date(adjacentMessage.sentAt)
    const diff =
      direction === 'next'
        ? adjDate.getTime() - thisDate.getTime()
        : thisDate.getTime() - adjDate.getTime()
    const isOutsideThreshold = diff > CLUSTERED_MESSAGE_THRESHOLD_MS
    // For pending messages, still check the time threshold
    if (isPending) return isOutsideThreshold
    return isOutsideThreshold
  }
  return true
}

let MessageItem = ({
  item,
  isGroupChat = false,
  prevMessage,
  nextMessage,
  relatedProfiles,
}: {
  item: ConvoItem & {type: 'message' | 'pending-message'}
  isGroupChat?: boolean
  prevMessage:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null
  nextMessage:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
}): React.ReactNode => {
  const t = useTheme()
  const {currentAccount} = useSession()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const queryClient = useQueryClient()

  const {message} = item
  const profile = useMaybeProfileShadow(relatedProfiles.get(message.sender.did))

  const {openReactions} = useMessageDialogs()
  const {scrollToMessage, highlightedMessage} = useMessageReplies()

  // `replyTo` comes back hydrated as the referenced message (or a deleted-
  // message tombstone). Narrow away the open-union fallback so we only render
  // shapes we understand.
  const replyTo =
    ChatBskyConvoDefs.isMessageView(message.replyTo) ||
    ChatBskyConvoDefs.isDeletedMessageView(message.replyTo)
      ? message.replyTo
      : undefined

  const isPending = item.type === 'pending-message'

  const displayName = profile ? createSanitizedDisplayName(profile) : null

  const isFromSelf =
    message.sender?.did != null && message.sender.did === currentAccount?.did

  const prevIsMessage = ChatBskyConvoDefs.isMessageView(prevMessage)
  const nextIsMessage = ChatBskyConvoDefs.isMessageView(nextMessage)

  const isPrevFromSameSender =
    prevIsMessage &&
    prevMessage.sender?.did === message.sender?.did &&
    message.sender?.did != null
  const isNextFromSameSender =
    nextIsMessage &&
    nextMessage.sender?.did === message.sender?.did &&
    message.sender?.did != null

  const isFirstInCluster = isWithinClusterBoundary({
    isPending,
    message,
    adjacentMessage: prevMessage,
    isFromSameSender: isPrevFromSameSender,
    direction: 'prev',
  })

  const isLastInCluster = isWithinClusterBoundary({
    isPending,
    message,
    adjacentMessage: nextMessage,
    isFromSameSender: isNextFromSameSender,
    direction: 'next',
  })

  const hasLargeGapFromPrev =
    !ChatBskyConvoDefs.isMessageView(prevMessage) ||
    new Date(message.sentAt).getTime() -
      new Date(prevMessage.sentAt).getTime() >
      MESSAGE_GAP_THRESHOLD_MS

  const isInCluster = !(isFirstInCluster && isLastInCluster)
  const isInMiddleOfCluster =
    isInCluster && !isFirstInCluster && !isLastInCluster

  const visibleReactions = useMemo(
    () => filterBlockedReactions(message.reactions, relatedProfiles),
    [message.reactions, relatedProfiles],
  )

  const hasReactions = visibleReactions.length > 0
  const prevHasReactions =
    prevIsMessage &&
    filterBlockedReactions(prevMessage.reactions, relatedProfiles).length > 0
  const isNextEmojiOnly = nextIsMessage && isOnlyEmoji(nextMessage.text)
  const isPrevEmojiOnly = prevIsMessage && isOnlyEmoji(prevMessage.text)
  const squaredBottomCorner =
    !hasReactions &&
    !isNextEmojiOnly &&
    isInCluster &&
    (isInMiddleOfCluster || isFirstInCluster)
  const squaredTopCorner =
    !prevHasReactions &&
    !isPrevEmojiOnly &&
    isInCluster &&
    (isInMiddleOfCluster || isLastInCluster)

  const pendingColor = t.palette.primary_300

  const bubbleColor = isFromSelf
    ? isPending
      ? pendingColor
      : t.palette.primary_500
    : t.palette.contrast_50
  const highlightColor = isFromSelf
    ? t.palette.primary_300
    : t.palette.primary_100

  const rt = new RichTextAPI({text: message.text, facets: message.facets})

  const hasEmbed =
    AppBskyEmbedRecord.isView(message.embed) ||
    ChatBskyEmbedJoinLink.isView(message.embed)
  const hasEmbedAndText = hasEmbed && rt.text.length > 0

  const targetBottomRadius = squaredBottomCorner
    ? SQUARED_BORDER_RADIUS
    : BORDER_RADIUS
  const targetTopRadius =
    squaredTopCorner || hasEmbedAndText ? SQUARED_BORDER_RADIUS : BORDER_RADIUS

  const bottomRadiusSV = useSharedValue(targetBottomRadius)
  const topRadiusSV = useSharedValue(targetTopRadius)

  const showDisplayName =
    isGroupChat && !isFromSelf && isFirstInCluster && !isOnlyEmoji(message.text)
  const showAvatar = isGroupChat && !isFromSelf && isLastInCluster

  useEffect(() => {
    bottomRadiusSV.set(withTiming(targetBottomRadius, {duration: 300}))
  }, [targetBottomRadius, bottomRadiusSV])

  useEffect(() => {
    topRadiusSV.set(withTiming(targetTopRadius, {duration: 300}))
  }, [targetTopRadius, topRadiusSV])

  // Flash the message background when it's been scrolled to (e.g. by tapping a
  // reply that quotes it), so it's easy to spot. Keyed on the highlight `key`
  // so re-tapping the same message re-triggers the flash.
  const highlightSV = useSharedValue(0)
  const isHighlighted = highlightedMessage?.id === message.id
  const highlightKey = isHighlighted ? highlightedMessage.key : null
  useEffect(() => {
    if (highlightKey === null) return
    highlightSV.set(
      withSequence(
        withTiming(1, {duration: 150}),
        withDelay(400, withTiming(0, {duration: 450})),
      ),
    )
  }, [highlightKey, highlightSV])

  const highlightStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      highlightSV.get(),
      [0, 1],
      [bubbleColor, highlightColor],
    ),
  }))

  const borderRadiusStyle = useAnimatedStyle(() =>
    isFromSelf
      ? {
          borderBottomRightRadius: bottomRadiusSV.get(),
          borderTopRightRadius: topRadiusSV.get(),
        }
      : {
          borderBottomLeftRadius: bottomRadiusSV.get(),
          borderTopLeftRadius: topRadiusSV.get(),
        },
  )

  const avatar =
    profile && moderationOpts ? (
      <PreviewableUserAvatar
        profile={profile}
        size={AVATAR_SIZE}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
        onBeforePress={() => unstableCacheProfileView(queryClient, profile)}
        moderation={moderateProfile(profile, moderationOpts).ui('avatar')}
      />
    ) : (
      <ProfileCard.AvatarPlaceholder size={AVATAR_SIZE} />
    )

  const groupedReactions = useMemo(
    () => groupReactions(visibleReactions),
    [visibleReactions],
  )

  const reactions = visibleReactions

  const hasSelfReacted = reactions.some(
    r => r.sender.did === currentAccount?.did,
  )

  const reactionsLabel = useMemo(() => {
    if (reactions.length === 0) return ''
    if (reactions.length === 1) {
      const reaction = reactions[0]
      const sender = reaction.sender
      if (sender.did === currentAccount?.did) {
        return l`You reacted ${reaction.value}`
      } else {
        const senderDid = reaction.sender.did
        const memberSender = relatedProfiles.get(senderDid)
        if (memberSender) {
          return l`${createSanitizedDisplayName(memberSender)} reacted ${reaction.value}`
        }
        return l`Someone reacted ${reaction.value}`
      }
    }
    return l`${plural(reactions.length, {
      one: '# person',
      other: '# people',
    })} reacted – ${groupedReactions.map(g => g.value).join(' ')}`
  }, [reactions, groupedReactions, currentAccount?.did, relatedProfiles, l])

  const appliedReactions = (
    <LayoutAnimationConfig skipEntering skipExiting>
      {hasReactions ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[
            a.absolute,
            {top: '100%'},
            isFromSelf ? [a.right_0] : [a.left_0, isGroupChat && a.ml_sm],
            a.px_sm,
            a.z_10,
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
              isFromSelf ? a.justify_end : a.justify_start,
              a.rounded_lg,
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.shadow_xs,
              a.px_sm,
              hasSelfReacted
                ? {backgroundColor: t.palette.primary_100}
                : t.atoms.bg_contrast_25,
              {
                paddingTop: platform({android: 2, default: 3}),
                paddingBottom: platform({android: 2, default: 3}),
                transform: [{translateY: -6}],
              },
            ]}
            onPress={isGroupChat ? () => openReactions(message) : undefined}>
            {groupedReactions.slice(0, 10).map(group => (
              <Animated.View
                entering={native(ZoomIn.springify(200).delay(400))}
                exiting={
                  groupedReactions.length > 1
                    ? native(ZoomOut.delay(200))
                    : undefined
                }
                layout={native(LinearTransition.delay(300))}
                key={group.value}
                style={[a.py_2xs]}>
                <Text
                  emoji
                  style={[
                    a.text_md,
                    {textAlignVertical: 'center', includeFontPadding: false},
                  ]}>
                  {group.value}
                </Text>
              </Animated.View>
            ))}
            {(groupedReactions.length !== reactions.length ||
              groupedReactions.length > 10) &&
            reactions.length > 1 ? (
              <View style={[a.p_2xs, a.pl_0, a.justify_center]}>
                <Text
                  style={[
                    a.text_sm,
                    a.font_medium,
                    hasSelfReacted
                      ? {color: t.palette.primary_900}
                      : t.atoms.text_contrast_high,
                    {textAlignVertical: 'center', includeFontPadding: false},
                  ]}>
                  {reactions.length}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </Animated.View>
      ) : null}
    </LayoutAnimationConfig>
  )

  const messageInset = platform<ViewStyle | undefined>({
    android: a.mx_sm,
    ios: a.mx_md,
    web: a.mx_lg,
  })

  return (
    <>
      {hasLargeGapFromPrev && <DateDivider date={message.sentAt} />}
      <View
        style={[
          messageInset,
          isFirstInCluster ? a.mt_md : {marginTop: CLUSTERED_MESSAGE_GAP},
          hasReactions && {paddingBottom: 26},
        ]}>
        <View style={[a.relative]}>
          {showAvatar ? (
            <View style={[a.absolute, a.bottom_0, a.z_50]}>{avatar}</View>
          ) : null}
          <View
            style={[
              a.relative,
              a.flex_grow,
              !isFromSelf && isGroupChat && {paddingLeft: AVATAR_SIZE},
            ]}>
            {replyTo ? (
              <ReplyCaption
                replyTo={replyTo}
                isFromSelf={isFromSelf}
                isGroupChat={isGroupChat}
                replierDisplayName={displayName}
                relatedProfiles={relatedProfiles}
                onPress={() => scrollToMessage(replyTo.id)}
              />
            ) : displayName && showDisplayName ? (
              <Text
                style={[
                  a.text_xs,
                  t.atoms.text_contrast_medium,
                  a.pt_xs,
                  a.pb_2xs,
                  {paddingLeft: DISPLAY_NAME_INSET},
                ]}
                emoji>
                {displayName}
              </Text>
            ) : null}
            {profile && isBlockedOrBlocking(profile) && isGroupChat ? (
              <BlockedPlaceholder profile={profile} style={borderRadiusStyle} />
            ) : (
              <View style={[a.relative]}>
                <ActionsWrapper
                  isFromSelf={isFromSelf}
                  message={message}
                  senderProfile={profile}
                  moderationOpts={moderationOpts}>
                  {AppBskyEmbedRecord.isView(message.embed) && (
                    <MessageItemEmbed
                      embed={message.embed}
                      isFromSelf={isFromSelf}
                      isGroupChat={isGroupChat}
                      squaredBottomCorner={
                        squaredBottomCorner || hasEmbedAndText
                      }
                      squaredTopCorner={squaredTopCorner}
                      highlightSV={highlightSV}
                    />
                  )}
                  {ChatBskyEmbedJoinLink.isView(message.embed) && (
                    <MessageItemInviteEmbed
                      embed={message.embed}
                      isFromSelf={isFromSelf}
                      isGroupChat={isGroupChat}
                      squaredBottomCorner={
                        squaredBottomCorner || hasEmbedAndText
                      }
                      squaredTopCorner={squaredTopCorner}
                      highlightSV={highlightSV}
                    />
                  )}
                  {rt.text.length > 0 && (
                    <Animated.View
                      accessibilityHint={l`Double tap or long press the message to add a reaction`}
                      style={[
                        !isFromSelf && isGroupChat && a.ml_sm,
                        !isOnlyEmoji(message.text) && [
                          a.rounded_xl,
                          a.py_sm,
                          a.px_md,
                          a.max_w_full,
                          {
                            marginTop: hasEmbedAndText
                              ? CLUSTERED_MESSAGE_GAP
                              : 0,
                          },
                          isFromSelf ? a.self_end : a.self_start,
                          borderRadiusStyle,
                          highlightStyle,
                        ],
                      ]}>
                      {replyTo && !isOnlyEmoji(message.text) ? (
                        <ReplyQuote
                          replyTo={replyTo}
                          isFromSelf={isFromSelf}
                          relatedProfiles={relatedProfiles}
                          onPress={() => scrollToMessage(replyTo.id)}
                        />
                      ) : null}
                      <RichText
                        value={rt}
                        style={[
                          a.text_md,
                          isFromSelf && {color: t.palette.white},
                          // Emoji-only: add top leading to avoid clipping the
                          // glyph, then pull the bottom up by the same amount so
                          // the glyph bottom-aligns with the avatar instead of
                          // sitting above its line-box baseline.
                          isOnlyEmoji(message.text) && [
                            a.leading_tight,
                            // Visually align bottom of the emoji with the avatar
                            !isFromSelf &&
                              platform({
                                android: {marginTop: a.mt_2xs.marginTop},
                                default: {marginBottom: -a.mb_sm.marginBottom},
                              }),
                          ],
                        ]}
                        interactiveStyle={a.underline}
                        enableTags
                        emojiMultiplier={3}
                        shouldProxyLinks={true}
                      />
                    </Animated.View>
                  )}
                </ActionsWrapper>
                {appliedReactions}
              </View>
            )}
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

  const handleRetry = (e: GestureResponderEvent) => {
    if (item.type === 'pending-message' && item.retry) {
      e.preventDefault()
      item.retry()
      return false
    }
  }

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

function BlockedPlaceholder({
  profile,
  style,
}: {
  profile: Shadow<ChatBskyActorDefs.ProfileViewBasic>
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const control = Prompt.usePromptControl()
  const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)

  return (
    <>
      <Button
        style={[{maxWidth: MESSAGE_BUBBLE_MAX_WIDTH}, a.self_start]}
        label={
          profile.viewer?.blocking
            ? l`This message is hidden because you are blocking this user.`
            : l`This message is hidden because this user is blocking you.`
        }
        accessibilityHint={l`Tap for details`}
        onPress={() => control.open()}>
        <Animated.View
          style={[
            a.ml_sm,
            a.rounded_xl,
            a.py_sm,
            a.px_md,
            t.atoms.bg,
            a.self_start,
            a.border,
            t.atoms.border_contrast_high,
            a.flex_shrink,
            style,
          ]}>
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              a.italic,
              t.atoms.text_contrast_medium,
            ]}>
            {profile.viewer?.blocking ? (
              <Trans>
                This message is hidden because you are blocking this user.
              </Trans>
            ) : (
              <Trans>
                This message is hidden because this user is blocking you.
              </Trans>
            )}
          </Text>
        </Animated.View>
      </Button>
      <Prompt.Outer control={control}>
        <Prompt.Content>
          <Prompt.TitleText>
            {profile.viewer?.blocking ? (
              <Trans>
                You are blocking {sanitizeHandle(profile.handle, '@')}
              </Trans>
            ) : (
              <Trans>
                {sanitizeHandle(profile.handle, '@')} is blocking you
              </Trans>
            )}
          </Prompt.TitleText>
          <Prompt.DescriptionText>
            {profile.viewer?.blocking ? (
              <Trans>
                Messages from this person are hidden while you are blocking
                them.
              </Trans>
            ) : (
              <Trans>
                Messages from this person are hidden while they are blocking
                you.
              </Trans>
            )}
          </Prompt.DescriptionText>
          <Prompt.Actions>
            <Prompt.Action onPress={() => {}} cta={l`Okay`} color="primary" />
            {profile.viewer?.blocking && !profile.viewer.blockingByList && (
              <Prompt.Action
                onPress={() => void queueUnblock()}
                cta={l`Unblock`}
                color="secondary"
              />
            )}
          </Prompt.Actions>
        </Prompt.Content>
      </Prompt.Outer>
    </>
  )
}

/**
 * The "↪ X replied to Y" caption rendered above a reply message, in place of
 * the display name. `X` is the person sending the reply (self -> "you"), `Y` is
 * the original sender. Tapping it scrolls to the original (if loaded).
 *
 * Aligns with the sender's display name for others (left), or with the message
 * bubble for self (right).
 */
function ReplyCaption({
  replyTo,
  isFromSelf,
  isGroupChat,
  replierDisplayName,
  relatedProfiles,
  onPress,
}: {
  replyTo: ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView
  isFromSelf: boolean
  isGroupChat: boolean
  replierDisplayName: string | null
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()

  const originalSenderIsSelf = replyTo.sender.did === currentAccount?.did
  const originalProfile = relatedProfiles.get(replyTo.sender.did)
  const originalName = originalSenderIsSelf
    ? null
    : originalProfile
      ? createSanitizedDisplayName(originalProfile)
      : null

  return (
    <Button
      label={l`Scroll to the message this is replying to`}
      onPress={onPress}
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.gap_2xs,
        a.pb_2xs,
        a.pt_xs,
        isFromSelf
          ? [a.justify_end, a.pr_md]
          : [
              a.justify_start,
              isGroupChat ? {paddingLeft: DISPLAY_NAME_INSET} : a.pl_md,
            ],
      ]}>
      <ArrowCornerDownRightIcon
        size="xs"
        style={t.atoms.text_contrast_medium}
      />
      <Text
        style={[a.text_xs, a.flex_shrink, t.atoms.text_contrast_medium]}
        numberOfLines={1}
        emoji>
        {isFromSelf ? (
          originalSenderIsSelf ? (
            <Trans>You replied to yourself</Trans>
          ) : originalName ? (
            <Trans>You replied to {originalName}</Trans>
          ) : (
            <Trans>You replied</Trans>
          )
        ) : originalSenderIsSelf ? (
          <Trans>{replierDisplayName} replied to you</Trans>
        ) : originalName ? (
          <Trans>
            {replierDisplayName} replied to {originalName}
          </Trans>
        ) : (
          <Trans>{replierDisplayName} replied</Trans>
        )}
      </Text>
    </Button>
  )
}

/**
 * The nested quote of the original message, rendered at the top of a reply
 * bubble. Tapping it scrolls to the original (if loaded).
 */
function ReplyQuote({
  replyTo,
  isFromSelf,
  relatedProfiles,
  onPress,
}: {
  replyTo: ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView
  isFromSelf: boolean
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const getReplyPreviewText = useReplyPreviewText()

  const senderProfile = useMaybeProfileShadow(
    relatedProfiles.get(replyTo.sender.did),
  )
  // Hide the quoted content if we block, or are blocked by, the original
  // sender - mirroring how the message bubble itself is hidden.
  const isBlocked = senderProfile ? isBlockedOrBlocking(senderProfile) : false
  const senderName =
    senderProfile && !isBlocked
      ? createSanitizedDisplayName(senderProfile)
      : null

  const tintColor = isFromSelf ? t.palette.white : t.atoms.text.color
  const subtleColor = isFromSelf
    ? t.palette.white
    : t.atoms.text_contrast_high.color
  const borderColor = isFromSelf
    ? utils.alpha(t.palette.white, 0.5)
    : t.atoms.border_contrast_high.borderColor

  let text: string
  let subtle = false
  if (isBlocked) {
    text = l({
      message: '(blocked message hidden)',
      comment: 'A reply summary in chat',
    })
    subtle = true
  } else if (ChatBskyConvoDefs.isMessageView(replyTo)) {
    ;({text, subtle} = getReplyPreviewText(replyTo))
  } else {
    text = l({message: '(deleted message)', comment: 'A reply summary in chat'})
    subtle = true
  }

  return (
    <Button
      label={
        senderName
          ? l`Replied-to message from ${senderName}, tap to scroll to it`
          : l`Replied-to message, tap to scroll to it`
      }
      onPress={onPress}
      style={[
        a.mb_xs,
        a.rounded_md,
        a.p_sm,
        // The padding above is a little loose, so we tighten it up here.
        {paddingTop: tokens.space.sm - 2},
        a.flex_col,
        a.align_start,
        a.border,
        {borderColor, marginHorizontal: -4},
      ]}>
      {senderName ? (
        <Text style={[a.text_xs, {color: subtleColor}]} emoji numberOfLines={1}>
          {senderName}
        </Text>
      ) : null}
      <Text
        style={[
          a.text_sm,
          {color: subtle ? subtleColor : tintColor},
          subtle && a.italic,
        ]}
        emoji
        numberOfLines={2}>
        {text}
      </Text>
    </Button>
  )
}

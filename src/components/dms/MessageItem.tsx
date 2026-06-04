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
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {
  AppBskyEmbedRecord,
  type ChatBskyActorDefs,
  ChatBskyConvoDefs,
  ChatBskyEmbedJoinLink,
  RichText as RichTextAPI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {isBlockedOrBlocking} from '#/lib/moderation/blocked-and-muted'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {type Shadow} from '#/state/cache/types'
import {type ConvoItem} from '#/state/messages/convo/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useSession} from '#/state/session'
import {atoms as a, native, platform, useTheme} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {Button} from '#/components/Button'
import {ActionsWrapper} from '#/components/dms/ActionsWrapper'
import {useMessageDialogs} from '#/components/dms/MessageOverlays'
import {InlineLinkText, Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {DateDivider} from './DateDivider'
import {MessageItemEmbed} from './MessageItemEmbed'
import {MessageItemInviteEmbed} from './MessageItemInviteEmbed'
import {groupReactions} from './ReactionsDialog'
import {CLUSTERED_MESSAGE_THRESHOLD_MS, MESSAGE_GAP_THRESHOLD_MS} from './util'

const AVATAR_SIZE = 28
const CLUSTERED_MESSAGE_GAP = 2
const BORDER_RADIUS = 18
const SQUARED_BORDER_RADIUS = 4
const DISPLAY_NAME_INSET = 22

function isWithinClusterBoundary({
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
  if (ChatBskyConvoDefs.isMessageView(adjacentMessage)) {
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
    adjacentMessage: prevMessage,
    isFromSameSender: isPrevFromSameSender,
    currentSentAt: message.sentAt,
    direction: 'prev',
  })

  const isLastInCluster = isWithinClusterBoundary({
    isPending,
    adjacentMessage: nextMessage,
    isFromSameSender: isNextFromSameSender,
    currentSentAt: message.sentAt,
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

  const hasReactions = message.reactions && message.reactions.length > 0
  const prevHasReactions =
    prevIsMessage && prevMessage.reactions && prevMessage.reactions.length > 0
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
      <Link
        style={[a.rounded_full]}
        label={l`${createSanitizedDisplayName(profile)}’s avatar`}
        accessibilityHint={l`Opens this profile`}
        to={makeProfileLink({
          did: profile.did,
          handle: profile.handle,
        })}
        onPress={() => unstableCacheProfileView(queryClient, profile)}>
        <ProfileCard.Avatar
          profile={profile}
          size={AVATAR_SIZE}
          moderationOpts={moderationOpts}
          disabledPreview
        />
      </Link>
    ) : (
      <ProfileCard.AvatarPlaceholder size={AVATAR_SIZE} />
    )

  const groupedReactions = useMemo(
    () => groupReactions(message.reactions),
    [message.reactions],
  )

  const reactions = useMemo(() => message.reactions ?? [], [message.reactions])

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
        <View
          style={[
            a.relative,
            a.bottom_0,
            isFromSelf ? [a.align_end] : [a.ml_sm, a.align_start],
            a.px_sm,
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
              a.flex_wrap,
              a.rounded_lg,
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.shadow_xs,
              hasSelfReacted
                ? {backgroundColor: t.palette.primary_100}
                : t.atoms.bg_contrast_25,
              {
                paddingTop: platform({android: 2, default: 3}),
                paddingBottom: platform({android: 2, default: 3}),
                paddingLeft: 6,
                paddingRight: 6,
                transform: [{translateY: -8}],
              },
            ]}
            onPress={isGroupChat ? () => openReactions(message) : undefined}>
            {groupedReactions.map(group => (
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
            {groupedReactions.length !== reactions.length &&
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
        </View>
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
        ]}>
        <View style={[a.relative]}>
          {showAvatar ? (
            <View
              style={[
                a.absolute,
                a.bottom_0,
                a.z_50,
                hasReactions && {
                  transform: [
                    {
                      translateY: platform({
                        ios: -29,
                        default: -27,
                      }),
                    },
                  ],
                },
              ]}>
              {avatar}
            </View>
          ) : null}
          <View
            style={[
              a.flex_grow,
              !isFromSelf && isGroupChat && {paddingLeft: AVATAR_SIZE},
            ]}>
            {displayName && showDisplayName ? (
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
              <ActionsWrapper
                hasReactions={hasReactions}
                isFromSelf={isFromSelf}
                message={message}
                senderProfile={profile}
                moderationOpts={moderationOpts}>
                {AppBskyEmbedRecord.isView(message.embed) && (
                  <MessageItemEmbed
                    embed={message.embed}
                    isFromSelf={isFromSelf}
                    isGroupChat={isGroupChat}
                    squaredBottomCorner={squaredBottomCorner || hasEmbedAndText}
                    squaredTopCorner={squaredTopCorner}
                  />
                )}
                {ChatBskyEmbedJoinLink.isView(message.embed) && (
                  <MessageItemInviteEmbed
                    embed={message.embed}
                    isFromSelf={isFromSelf}
                    isGroupChat={isGroupChat}
                    squaredBottomCorner={squaredBottomCorner || hasEmbedAndText}
                    squaredTopCorner={squaredTopCorner}
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
                        {
                          marginTop: hasEmbedAndText
                            ? CLUSTERED_MESSAGE_GAP
                            : 0,
                          backgroundColor: isFromSelf
                            ? isPending
                              ? pendingColor
                              : t.palette.primary_500
                            : t.palette.contrast_50,
                        },
                        isFromSelf ? a.self_end : a.self_start,
                        borderRadiusStyle,
                      ],
                    ]}>
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
                {appliedReactions}
              </ActionsWrapper>
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
        style={[{maxWidth: '80%'}, a.self_start]}
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
                onPress={() => queueUnblock()}
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

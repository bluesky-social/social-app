import {memo, useCallback, useEffect, useMemo, useRef} from 'react'
import {
  type GestureResponderEvent,
  LayoutAnimation,
  Pressable,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
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
  ChatBskyConvoDefs,
  RichText as RichTextAPI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useConvoActive} from '#/state/messages/convo'
import {type ConvoItem} from '#/state/messages/convo/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useSession} from '#/state/session'
import {atoms as a, native, platform, useTheme} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {useDialogControl} from '#/components/Dialog'
import {ActionsWrapper} from '#/components/dms/ActionsWrapper'
import {InlineLinkText, Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {DateDivider} from './DateDivider'
import {useDateDividerToggle} from './DateDividerToggle'
import {MessageItemEmbed} from './MessageItemEmbed'
import {ReactionsDialog} from './ReactionsDialog'

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
  const queryClient = useQueryClient()

  const reactionsControl = useDialogControl()
  const reactionTapRef = useRef(false)

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

  const {isDividerToggled, toggleDivider} = useDateDividerToggle()
  const isDateDividerToggled = isDividerToggled(message.id)
  const isNextDateDividerToggled =
    nextMessage != null && isDividerToggled(nextMessage.id)
  const showDateDivider = hasLargeGapFromPrev

  const effectiveFirstInCluster = isFirstInCluster || isDateDividerToggled
  const effectiveLastInCluster = isLastInCluster || isNextDateDividerToggled
  const isInCluster = !(effectiveFirstInCluster && effectiveLastInCluster)
  const isInMiddleOfCluster =
    isInCluster && !effectiveFirstInCluster && !effectiveLastInCluster

  const hasReactions = message.reactions && message.reactions.length > 0
  const squaredBottomCorner =
    !hasReactions &&
    isInCluster &&
    (isInMiddleOfCluster || effectiveFirstInCluster)
  const squaredTopCorner =
    isInCluster && (isInMiddleOfCluster || effectiveLastInCluster)

  const pendingColor = t.palette.primary_300

  const rt = useMemo(() => {
    return new RichTextAPI({text: message.text, facets: message.facets})
  }, [message.text, message.facets])

  const hasEmbedAndText =
    AppBskyEmbedRecord.isView(message.embed) && rt.text.length > 0

  const targetBottomRadius =
    squaredBottomCorner || hasEmbedAndText
      ? SQUARED_BORDER_RADIUS
      : BORDER_RADIUS
  const targetTopRadius = squaredTopCorner
    ? SQUARED_BORDER_RADIUS
    : BORDER_RADIUS

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

  const avatar = profile ? (
    <Link
      label={l`${sanitizeDisplayName(
        profile.displayName || sanitizeHandle(profile.handle),
      )}’s avatar`}
      accessibilityHint={l`Opens this profile`}
      to={makeProfileLink({
        did: profile.did,
        handle: profile.handle,
      })}
      onPress={() => unstableCacheProfileView(queryClient, profile)}>
      <ProfileCard.Avatar
        profile={profile}
        size={AVATAR_SIZE}
        moderationOpts={moderationOpts!}
        disabledPreview
      />
    </Link>
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
              a.px_xs,
              isFromSelf ? a.justify_end : a.justify_start,
              a.flex_wrap,
              a.rounded_lg,
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_25,
              t.atoms.shadow_sm,
              {
                paddingTop: platform({android: 2, default: 3}),
                paddingBottom: platform({android: 2, default: 3}),
                transform: [{translateY: -8}],
              },
            ]}
            onPressIn={() => {
              // Don't toggle the date divider when tapping a reaction.
              reactionTapRef.current = true
            }}
            onPressOut={() => {
              // Include a delay here to account for tap-and-drag before release.
              setTimeout(() => {
                reactionTapRef.current = false
              }, 100)
            }}
            onPress={() => (isGroupChat ? reactionsControl.open() : undefined)}>
            {groupedReactions.map(group => (
              <Animated.View
                entering={native(ZoomIn.springify(200).delay(400))}
                exiting={
                  groupedReactions.length > 1 && native(ZoomOut.delay(200))
                }
                layout={native(LinearTransition.delay(300))}
                key={group.value}
                style={[a.py_2xs]}>
                <Text
                  emoji
                  style={[
                    a.text_xs,
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
                    a.text_xs,
                    t.atoms.text_contrast_medium,
                    {textAlignVertical: 'center', includeFontPadding: false},
                  ]}>
                  {reactions.length}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      ) : null}
      <ReactionsDialog
        control={reactionsControl}
        members={convo.members}
        message={message}
        reactions={message.reactions}
        groupedReactions={groupedReactions}
      />
    </LayoutAnimationConfig>
  )

  const messageInset = platform<ViewStyle | undefined>({
    ios: isFromSelf ? a.mr_md : isGroupChat ? a.ml_md : a.ml_sm,
    android: isFromSelf ? a.mr_sm : isGroupChat ? a.ml_sm : undefined,
    web: isFromSelf ? a.mr_sm : isGroupChat ? a.ml_sm : undefined,
  })

  return (
    <>
      {(showDateDivider || isDateDividerToggled) && (
        <Animated.View entering={native(FadeIn)} exiting={native(FadeOut)}>
          <DateDivider date={message.sentAt} />
        </Animated.View>
      )}
      <View
        style={[messageInset, isFirstInCluster && !showDateDivider && a.mt_sm]}>
        <View style={[a.relative]}>
          {showAvatar ? (
            <View
              style={[
                a.absolute,
                a.bottom_0,
                a.z_50,
                {
                  transform: [{translateY: hasReactions ? -24 : 0}],
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
            {showDisplayName ? (
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
            <ActionsWrapper
              hasReactions={hasReactions}
              isFromSelf={isFromSelf}
              message={message}
              onTap={() => {
                if (reactionTapRef.current) return
                if (!hasLargeGapFromPrev) {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  )
                  toggleDivider(message.id)
                }
              }}>
              {rt.text.length > 0 && (
                <Animated.View
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
                            marginTop: effectiveFirstInCluster
                              ? 0
                              : CLUSTERED_MESSAGE_GAP,
                            backgroundColor: isFromSelf
                              ? isPending
                                ? pendingColor
                                : t.palette.primary_500
                              : t.palette.contrast_50,
                          },
                          isFromSelf ? a.self_end : a.self_start,
                          borderRadiusStyle,
                        ]),
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
        {effectiveLastInCluster && (
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

import React, {useCallback, useMemo, useState} from 'react'
import {GestureResponderEvent, View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  ChatBskyConvoDefs,
  moderateProfile,
  ModerationOpts,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {GestureActionView} from '#/lib/custom-animations/GestureActionView'
import {useHaptics} from '#/lib/haptics'
import {decrementBadgeCount} from '#/lib/notifications/notifications'
import {logEvent} from '#/lib/statsig/statsig'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {
  postUriToRelativePath,
  toBskyAppUrl,
  toShortUrl,
} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useMarkAsReadMutation} from '#/state/queries/messages/conversation'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import * as tokens from '#/alf/tokens'
import {useDialogControl} from '#/components/Dialog'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {Bell2Off_Filled_Corner0_Rounded as BellStroke} from '#/components/icons/Bell2'
import {Envelope_Open_Stroke2_Corner0_Rounded as EnvelopeOpen} from '#/components/icons/EnveopeOpen'
import {Trash_Stroke2_Corner0_Rounded} from '#/components/icons/Trash'
import {Link} from '#/components/Link'
import {useMenuControl} from '#/components/Menu'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {Text} from '#/components/Typography'

export let ChatListItem = ({
  convo,
}: {
  convo: ChatBskyConvoDefs.ConvoView
}): React.ReactNode => {
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  const otherUser = convo.members.find(
    member => member.did !== currentAccount?.did,
  )

  if (!otherUser || !moderationOpts) {
    return null
  }

  return (
    <ChatListItemReady
      convo={convo}
      profile={otherUser}
      moderationOpts={moderationOpts}
    />
  )
}

ChatListItem = React.memo(ChatListItem)

function ChatListItemReady({
  convo,
  profile: profileUnshadowed,
  moderationOpts,
}: {
  convo: ChatBskyConvoDefs.ConvoView
  profile: AppBskyActorDefs.ProfileViewBasic
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const menuControl = useMenuControl()
  const leaveConvoControl = useDialogControl()
  const {gtMobile} = useBreakpoints()
  const profile = useProfileShadow(profileUnshadowed)
  const {mutate: markAsRead} = useMarkAsReadMutation()
  const moderation = React.useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const playHaptic = useHaptics()
  const isUnread = convo.unreadCount > 0

  const blockInfo = useMemo(() => {
    const modui = moderation.ui('profileView')
    const blocks = modui.alerts.filter(alert => alert.type === 'blocking')
    const listBlocks = blocks.filter(alert => alert.source.type === 'list')
    const userBlock = blocks.find(alert => alert.source.type === 'user')
    return {
      listBlocks,
      userBlock,
    }
  }, [moderation])

  const isDeletedAccount = profile.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? _(msg`Deleted Account`)
    : sanitizeDisplayName(
        profile.displayName || profile.handle,
        moderation.ui('displayName'),
      )

  const isDimStyle = convo.muted || moderation.blocked || isDeletedAccount

  const {lastMessage, lastMessageSentAt} = useMemo(() => {
    let lastMessage = _(msg`No messages yet`)
    let lastMessageSentAt: string | null = null

    if (ChatBskyConvoDefs.isMessageView(convo.lastMessage)) {
      const isFromMe = convo.lastMessage.sender?.did === currentAccount?.did

      if (convo.lastMessage.text) {
        if (isFromMe) {
          lastMessage = _(msg`You: ${convo.lastMessage.text}`)
        } else {
          lastMessage = convo.lastMessage.text
        }
      } else if (convo.lastMessage.embed) {
        const defaultEmbeddedContentMessage = _(
          msg`(contains embedded content)`,
        )

        if (AppBskyEmbedRecord.isView(convo.lastMessage.embed)) {
          const embed = convo.lastMessage.embed

          if (AppBskyEmbedRecord.isViewRecord(embed.record)) {
            const record = embed.record
            const path = postUriToRelativePath(record.uri, {
              handle: record.author.handle,
            })
            const href = path ? toBskyAppUrl(path) : undefined
            const short = href
              ? toShortUrl(href)
              : defaultEmbeddedContentMessage
            if (isFromMe) {
              lastMessage = _(msg`You: ${short}`)
            } else {
              lastMessage = short
            }
          }
        } else {
          if (isFromMe) {
            lastMessage = _(msg`You: ${defaultEmbeddedContentMessage}`)
          } else {
            lastMessage = defaultEmbeddedContentMessage
          }
        }
      }

      lastMessageSentAt = convo.lastMessage.sentAt
    }
    if (ChatBskyConvoDefs.isDeletedMessageView(convo.lastMessage)) {
      lastMessage = isDeletedAccount
        ? _(msg`Conversation deleted`)
        : _(msg`Message deleted`)
    }

    return {
      lastMessage,
      lastMessageSentAt,
    }
  }, [_, convo.lastMessage, currentAccount?.did, isDeletedAccount])

  const [showActions, setShowActions] = useState(false)

  const onMouseEnter = useCallback(() => {
    setShowActions(true)
  }, [])

  const onMouseLeave = useCallback(() => {
    setShowActions(false)
  }, [])

  const onFocus = useCallback<React.FocusEventHandler>(e => {
    if (e.nativeEvent.relatedTarget == null) return
    setShowActions(true)
  }, [])

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      decrementBadgeCount(convo.unreadCount)
      if (isDeletedAccount) {
        e.preventDefault()
        menuControl.open()
        return false
      } else {
        logEvent('chat:open', {logContext: 'ChatsList'})
      }
    },
    [convo.unreadCount, isDeletedAccount, menuControl],
  )

  const onLongPress = useCallback(() => {
    playHaptic()
    menuControl.open()
  }, [playHaptic, menuControl])

  const markReadAction = {
    threshold: 120,
    color: t.palette.primary_500,
    icon: EnvelopeOpen,
    action: () => {
      markAsRead({
        convoId: convo.id,
      })
    },
  }

  const deleteAction = {
    threshold: 225,
    color: t.palette.negative_500,
    icon: Trash_Stroke2_Corner0_Rounded,
    action: () => {
      leaveConvoControl.open()
    },
  }

  const actions = isUnread
    ? {
        leftFirst: markReadAction,
        leftSecond: deleteAction,
      }
    : {
        leftFirst: deleteAction,
      }

  return (
    <GestureActionView actions={actions}>
      <View
        // @ts-expect-error web only
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onMouseLeave}
        style={[a.relative, t.atoms.bg]}>
        <View
          style={[
            a.z_10,
            a.absolute,
            {top: tokens.space.md, left: tokens.space.lg},
          ]}>
          <PreviewableUserAvatar
            profile={profile}
            size={52}
            moderation={moderation.ui('avatar')}
          />
        </View>

        <Link
          to={`/messages/${convo.id}`}
          label={displayName}
          accessibilityHint={
            !isDeletedAccount
              ? _(msg`Go to conversation with ${profile.handle}`)
              : _(
                  msg`This conversation is with a deleted or a deactivated account. Press for options.`,
                )
          }
          accessibilityActions={
            isNative
              ? [
                  {name: 'magicTap', label: _(msg`Open conversation options`)},
                  {name: 'longpress', label: _(msg`Open conversation options`)},
                ]
              : undefined
          }
          onPress={onPress}
          onLongPress={isNative ? onLongPress : undefined}
          onAccessibilityAction={onLongPress}>
          {({hovered, pressed, focused}) => (
            <View
              style={[
                a.flex_row,
                isDeletedAccount ? a.align_center : a.align_start,
                a.flex_1,
                a.px_lg,
                a.py_md,
                a.gap_md,
                (hovered || pressed || focused) && t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
              ]}>
              {/* Avatar goes here */}
              <View style={{width: 52, height: 52}} />

              <View
                style={[a.flex_1, a.justify_center, web({paddingRight: 45})]}>
                <View style={[a.w_full, a.flex_row, a.align_end, a.pb_2xs]}>
                  <Text
                    numberOfLines={1}
                    style={[{maxWidth: '85%'}, web([a.leading_normal])]}>
                    <Text
                      emoji
                      style={[
                        a.text_md,
                        t.atoms.text,
                        a.font_bold,
                        {lineHeight: 21},
                        isDimStyle && t.atoms.text_contrast_medium,
                      ]}>
                      {displayName}
                    </Text>
                  </Text>
                  {lastMessageSentAt && (
                    <TimeElapsed timestamp={lastMessageSentAt}>
                      {({timeElapsed}) => (
                        <Text
                          style={[
                            a.text_sm,
                            {lineHeight: 21},
                            t.atoms.text_contrast_medium,
                            web({whiteSpace: 'preserve nowrap'}),
                          ]}>
                          {' '}
                          &middot; {timeElapsed}
                        </Text>
                      )}
                    </TimeElapsed>
                  )}
                  {(convo.muted || moderation.blocked) && (
                    <Text
                      style={[
                        a.text_sm,
                        {lineHeight: 21},
                        t.atoms.text_contrast_medium,
                        web({whiteSpace: 'preserve nowrap'}),
                      ]}>
                      {' '}
                      &middot;{' '}
                      <BellStroke
                        size="xs"
                        style={[t.atoms.text_contrast_medium]}
                      />
                    </Text>
                  )}
                </View>

                {!isDeletedAccount && (
                  <Text
                    numberOfLines={1}
                    style={[a.text_sm, t.atoms.text_contrast_medium, a.pb_xs]}>
                    @{profile.handle}
                  </Text>
                )}

                <Text
                  emoji
                  numberOfLines={2}
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    convo.unreadCount > 0
                      ? a.font_bold
                      : t.atoms.text_contrast_high,
                    isDimStyle && t.atoms.text_contrast_medium,
                  ]}>
                  {lastMessage}
                </Text>

                <PostAlerts
                  modui={moderation.ui('contentList')}
                  size="lg"
                  style={[a.pt_xs]}
                />
              </View>

              {convo.unreadCount > 0 && (
                <View
                  style={[
                    a.absolute,
                    a.rounded_full,
                    {
                      backgroundColor: isDimStyle
                        ? t.palette.contrast_200
                        : t.palette.primary_500,
                      height: 7,
                      width: 7,
                      top: 15,
                      right: 12,
                    },
                  ]}
                />
              )}
            </View>
          )}
        </Link>

        <ConvoMenu
          convo={convo}
          profile={profile}
          control={menuControl}
          currentScreen="list"
          showMarkAsRead={convo.unreadCount > 0}
          hideTrigger={isNative}
          blockInfo={blockInfo}
          style={[
            a.absolute,
            a.h_full,
            a.self_end,
            a.justify_center,
            {
              right: tokens.space.lg,
              opacity: !gtMobile || showActions || menuControl.isOpen ? 1 : 0,
            },
          ]}
        />
        <LeaveConvoPrompt
          control={leaveConvoControl}
          convoId={convo.id}
          currentScreen="list"
        />
      </View>
    </GestureActionView>
  )
}

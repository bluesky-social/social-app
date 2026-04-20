import {useCallback, useMemo, useState} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {
  AppBskyEmbedRecord,
  ChatBskyConvoDefs,
  moderateProfile,
  type ModerationDecision,
  type ModerationOpts,
} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {GestureActionView} from '#/lib/custom-animations/GestureActionView'
import {useHaptics} from '#/lib/haptics'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {decrementBadgeCount} from '#/lib/notifications/notifications'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {
  postUriToRelativePath,
  toBskyAppUrl,
  toShortUrl,
} from '#/lib/strings/url-helpers'
import {type Shadow, useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  precacheConvoQuery,
  useMarkAsReadMutation,
} from '#/state/queries/messages/conversation'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import * as tokens from '#/alf/tokens'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {useDialogControl} from '#/components/Dialog'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {getSystemMessageInfo} from '#/components/dms/systemMessage'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'
import {Bell2Off_Filled_Corner0_Rounded as BellStroke} from '#/components/icons/Bell2'
import {Envelope_Open_Stroke2_Corner0_Rounded as EnvelopeOpen} from '#/components/icons/EnveopeOpen'
import {Trash_Stroke2_Corner0_Rounded} from '#/components/icons/Trash'
import {Link} from '#/components/Link'
import {useMenuControl} from '#/components/Menu'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {createPortalGroup} from '#/components/Portal'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'

export const ChatListItemPortal = createPortalGroup()

/**
 * IMPORTANT NOTE: THIS IS CURRENTLY JANKY AF AND PROBABLY BROKEN, JUST WANTED TO ADD GROUPCHAT SUPPPORT
 *
 * TAKE A SECOND PASS PLEASE -sfn
 */

export function ChatListItem({
  convo: convoView,
  showMenu = true,
  children,
}: {
  convo: ChatBskyConvoDefs.ConvoView
  showMenu?: boolean
  children?: React.ReactNode
}) {
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  if (!moderationOpts) {
    return null
  }

  const convo = parseConvoView(convoView, currentAccount?.did)

  switch (convo?.kind) {
    case 'direct': {
      return (
        <DirectChatItem
          convo={convo}
          moderationOpts={moderationOpts}
          showMenu={showMenu}>
          {children}
        </DirectChatItem>
      )
    }
    case 'group': {
      return (
        <GroupChatItem
          convo={convo}
          moderationOpts={moderationOpts}
          showMenu={showMenu}
        />
      )
    }
    default: {
      return null
    }
  }
}

function DirectChatItem({
  convo,
  moderationOpts,
  showMenu,
  children,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'direct'}>
  moderationOpts: ModerationOpts
  showMenu?: boolean
  children?: React.ReactNode
}) {
  const {t: l} = useLingui()
  const profile = useProfileShadow(convo.primaryMember)

  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )

  const isDeletedAccount = profile.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : createSanitizedDisplayName(profile, true, moderation.ui('displayName'))

  return (
    <BaseChatItem
      convo={convo.view}
      avatar={
        <PreviewableUserAvatar
          profile={profile}
          size={52}
          moderation={moderation.ui('avatar')}
        />
      }
      primaryProfile={profile}
      primaryProfileModeration={moderation}
      title={displayName}
      subtitle={
        isDeletedAccount ? undefined : sanitizeHandle(profile.handle, '@')
      }
      accessibilityHint={
        !isDeletedAccount
          ? l`Go to conversation with ${profile.handle}`
          : l`This conversation is with a deleted or a deactivated account. Press for options`
      }
      showMenu={showMenu}
      isDeletedAccount={isDeletedAccount}
      isBlockedAccount={moderation.blocked}
      showProfileBadges
      postAlerts={
        <PostAlerts
          modui={moderation.ui('contentList')}
          size="lg"
          style={[a.pt_xs]}
        />
      }>
      {children}
    </BaseChatItem>
  )
}

function GroupChatItem({
  convo,
  moderationOpts,
  showMenu,
  children,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
  moderationOpts: ModerationOpts
  showMenu?: boolean
  children?: React.ReactNode
}) {
  const {t: l} = useLingui()
  const groupOwner = useProfileShadow(convo.primaryMember)

  const moderation = useMemo(
    () => moderateProfile(groupOwner, moderationOpts),
    [groupOwner, moderationOpts],
  )

  const chatName = convo.details.name

  return (
    <BaseChatItem
      convo={convo.view}
      avatar={<AvatarBubbles profiles={convo.members} size="medium" />}
      title={chatName}
      accessibilityHint={l`Go to the group chat named "${chatName}"`}
      primaryProfile={groupOwner}
      primaryProfileModeration={moderation}
      isBlockedAccount={false}
      isDeletedAccount={false}
      showProfileBadges={false}
      showMenu={showMenu}>
      {children}
    </BaseChatItem>
  )
}

function BaseChatItem({
  convo,
  avatar,
  title,
  subtitle,
  accessibilityHint,
  isDeletedAccount,
  isBlockedAccount,
  primaryProfile,
  primaryProfileModeration,
  showMenu,
  showProfileBadges,
  postAlerts,
  children,
}: {
  convo: ChatBskyConvoDefs.ConvoView
  avatar: React.ReactNode
  title: string
  subtitle?: string
  accessibilityHint: string
  isDeletedAccount: boolean
  isBlockedAccount: boolean
  primaryProfile: Shadow<bsky.profile.AnyProfileView>
  primaryProfileModeration: ModerationDecision
  showMenu?: boolean
  showProfileBadges: boolean
  postAlerts?: React.ReactNode
  children?: React.ReactNode
}) {
  const ax = useAnalytics()
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const {currentAccount} = useSession()
  const menuControl = useMenuControl()
  const leaveConvoControl = useDialogControl()
  const {mutate: markAsRead} = useMarkAsReadMutation()
  const {gtMobile} = useBreakpoints()

  const playHaptic = useHaptics()
  const queryClient = useQueryClient()
  const isUnread = convo.unreadCount > 0

  const blockInfo = useMemo(() => {
    const modui = primaryProfileModeration.ui('profileView')
    const blocks = modui.alerts.filter(alert => alert.type === 'blocking')
    const listBlocks = blocks.filter(alert => alert.source.type === 'list')
    const userBlock = blocks.find(alert => alert.source.type === 'user')
    return {
      listBlocks,
      userBlock,
    }
  }, [primaryProfileModeration])

  const isDimStyle = convo.muted || isBlockedAccount || isDeletedAccount

  const {lastMessage, lastMessageSentAt, latestReportableMessage} =
    useMemo(() => {
      let lastMessage = l`No messages yet`

      let lastMessageSentAt: string | null = null

      let latestReportableMessage: ChatBskyConvoDefs.MessageView | undefined

      // Message
      if (ChatBskyConvoDefs.isMessageView(convo.lastMessage)) {
        const isFromMe = convo.lastMessage.sender?.did === currentAccount?.did

        if (!isFromMe) {
          latestReportableMessage = convo.lastMessage
        }

        if (convo.lastMessage.text) {
          if (isFromMe) {
            lastMessage = l`You: ${convo.lastMessage.text}`
          } else {
            lastMessage = convo.lastMessage.text
          }
        } else if (convo.lastMessage.embed) {
          const defaultEmbeddedContentMessage = l`(contains embedded content)`

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
                lastMessage = l`You: ${short}`
              } else {
                lastMessage = short
              }
            }
          } else {
            if (isFromMe) {
              lastMessage = l`You: ${defaultEmbeddedContentMessage}`
            } else {
              lastMessage = defaultEmbeddedContentMessage
            }
          }
        }

        lastMessageSentAt = convo.lastMessage.sentAt
      }

      // Deleted message
      if (ChatBskyConvoDefs.isDeletedMessageView(convo.lastMessage)) {
        lastMessageSentAt = convo.lastMessage.sentAt

        lastMessage = isDeletedAccount
          ? l`Conversation deleted`
          : l`Message deleted`
      }

      // Reaction
      if (ChatBskyConvoDefs.isMessageAndReactionView(convo.lastReaction)) {
        if (
          !lastMessageSentAt ||
          new Date(lastMessageSentAt) <
            new Date(convo.lastReaction.reaction.createdAt)
        ) {
          const isFromMe =
            convo.lastReaction.reaction.sender.did === currentAccount?.did
          const lastMessageText = convo.lastReaction.message.text
          const fallbackMessage = l({
            message: 'a message',
            comment: `If last message does not contain text, fall back to "{user} reacted to {a message}"`,
          })

          if (isFromMe) {
            lastMessage = l`You reacted ${convo.lastReaction.reaction.value} to ${
              lastMessageText
                ? `"${convo.lastReaction.message.text}"`
                : fallbackMessage
            }`
          } else {
            const senderDid = convo.lastReaction.reaction.sender.did
            const sender = convo.members.find(
              member => member.did === senderDid,
            )
            if (sender) {
              lastMessage = l`${sanitizeDisplayName(
                sender.displayName || sender.handle,
              )} reacted ${convo.lastReaction.reaction.value} to ${
                lastMessageText
                  ? `"${convo.lastReaction.message.text}"`
                  : fallbackMessage
              }`
            } else {
              lastMessage = l`Someone reacted ${convo.lastReaction.reaction.value} to ${
                lastMessageText
                  ? `"${convo.lastReaction.message.text}"`
                  : fallbackMessage
              }`
            }
          }
        }
      }

      // System message
      if (ChatBskyConvoDefs.isSystemMessageView(convo.lastMessage)) {
        const info = getSystemMessageInfo(convo.lastMessage.data)
        if (info) {
          lastMessage = i18n._(info.message)
        }
      }

      return {
        lastMessage,
        lastMessageSentAt,
        latestReportableMessage,
      }
    }, [
      l,
      i18n,
      convo.lastMessage,
      convo.lastReaction,
      currentAccount?.did,
      isDeletedAccount,
      convo.members,
    ])

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
      for (const member of convo.members) {
        unstableCacheProfileView(queryClient, member)
      }
      precacheConvoQuery(queryClient, convo)
      void decrementBadgeCount(convo.unreadCount)
      if (isDeletedAccount) {
        e.preventDefault()
        menuControl.open()
        return false
      } else {
        ax.metric('chat:open', {logContext: 'ChatsList'})
      }
    },
    [ax, isDeletedAccount, menuControl, queryClient, convo],
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

  const hasUnread = convo.unreadCount > 0 && !isDeletedAccount

  return (
    <ChatListItemPortal.Provider>
      <GestureActionView actions={actions}>
        <View
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          // @ts-expect-error web only
          onFocus={onFocus}
          onBlur={onMouseLeave}
          style={[a.relative, t.atoms.bg]}>
          <View
            style={[
              a.z_10,
              a.absolute,
              {top: tokens.space.md, left: tokens.space.lg},
            ]}>
            {avatar}
          </View>

          <Link
            to={`/messages/${convo.id}`}
            label={title}
            accessibilityHint={accessibilityHint}
            accessibilityActions={
              showMenu && IS_NATIVE
                ? [
                    {
                      name: 'magicTap',
                      label: l`Open conversation options`,
                    },
                    {
                      name: 'longpress',
                      label: l`Open conversation options`,
                    },
                  ]
                : undefined
            }
            onPressIn={() => precacheConvoQuery(queryClient, convo)}
            onPress={onPress}
            onLongPress={showMenu && IS_NATIVE ? onLongPress : undefined}
            onAccessibilityAction={showMenu ? onLongPress : undefined}>
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
                ]}>
                {/* Avatar goes here */}
                <View style={{width: 52, height: 52}} />

                <View
                  style={[a.flex_1, a.justify_center, web({paddingRight: 45})]}>
                  <View style={[a.w_full, a.flex_row, a.align_end, a.pb_2xs]}>
                    <View style={[a.flex_shrink]}>
                      <Text
                        emoji
                        numberOfLines={1}
                        style={[
                          a.text_md,
                          t.atoms.text,
                          a.font_semi_bold,
                          {lineHeight: 21},
                          isDimStyle && t.atoms.text_contrast_medium,
                        ]}>
                        {title}
                      </Text>
                    </View>

                    {showProfileBadges && (
                      <ProfileBadges
                        profile={primaryProfile}
                        size="md"
                        style={[a.pl_xs, a.self_center]}
                      />
                    )}

                    {lastMessageSentAt && (
                      <View style={[a.pl_xs]}>
                        <TimeElapsed timestamp={lastMessageSentAt}>
                          {({timeElapsed}) => (
                            <Text
                              style={[
                                a.text_sm,
                                {lineHeight: 21},
                                t.atoms.text_contrast_medium,
                                web({whiteSpace: 'preserve nowrap'}),
                              ]}>
                              &middot; {timeElapsed}
                            </Text>
                          )}
                        </TimeElapsed>
                      </View>
                    )}
                    {(convo.muted || isBlockedAccount) && (
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

                  {subtitle && (
                    <Text
                      numberOfLines={1}
                      style={[
                        a.text_sm,
                        t.atoms.text_contrast_medium,
                        a.pb_xs,
                      ]}>
                      {subtitle}
                    </Text>
                  )}

                  <Text
                    emoji
                    numberOfLines={2}
                    style={[
                      a.text_sm,
                      a.leading_snug,
                      hasUnread ? a.font_semi_bold : t.atoms.text_contrast_high,
                      isDimStyle && t.atoms.text_contrast_medium,
                    ]}>
                    {lastMessage}
                  </Text>

                  {postAlerts}

                  {children}
                </View>

                {hasUnread && (
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

          <ChatListItemPortal.Outlet />

          {showMenu && (
            <ConvoMenu
              convo={convo}
              profile={primaryProfile}
              control={menuControl}
              currentScreen="list"
              showMarkAsRead={convo.unreadCount > 0}
              hideTrigger={IS_NATIVE}
              blockInfo={blockInfo}
              style={[
                a.absolute,
                a.h_full,
                a.self_end,
                a.justify_center,
                {
                  right: tokens.space.lg,
                  opacity:
                    !gtMobile || showActions || menuControl.isOpen ? 1 : 0,
                },
              ]}
              latestReportableMessage={latestReportableMessage}
            />
          )}

          <LeaveConvoPrompt
            control={leaveConvoControl}
            convoId={convo.id}
            currentScreen="list"
          />
        </View>
      </GestureActionView>
    </ChatListItemPortal.Provider>
  )
}

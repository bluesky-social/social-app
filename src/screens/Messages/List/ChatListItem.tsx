import React, {useCallback, useState} from 'react'
import {GestureResponderEvent, View} from 'react-native'
import {
  AppBskyActorDefs,
  ChatBskyConvoDefs,
  moderateProfile,
  ModerationOpts,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {useHaptics} from 'lib/haptics'
import {logEvent} from 'lib/statsig/statsig'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {Bell2Off_Filled_Corner0_Rounded as BellStroke} from '#/components/icons/Bell2'
import {Link} from '#/components/Link'
import {useMenuControl} from '#/components/Menu'
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
  const {gtMobile} = useBreakpoints()
  const profile = useProfileShadow(profileUnshadowed)
  const moderation = React.useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const playHaptic = useHaptics()

  const blockInfo = React.useMemo(() => {
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
    ? 'Deleted Account'
    : sanitizeDisplayName(
        profile.displayName || profile.handle,
        moderation.ui('displayName'),
      )

  const isDimStyle = convo.muted || moderation.blocked || isDeletedAccount

  let lastMessage = _(msg`No messages yet`)
  let lastMessageSentAt: string | null = null
  if (ChatBskyConvoDefs.isMessageView(convo.lastMessage)) {
    if (convo.lastMessage.sender?.did === currentAccount?.did) {
      lastMessage = _(msg`You: ${convo.lastMessage.text}`)
    } else {
      lastMessage = convo.lastMessage.text
    }
    lastMessageSentAt = convo.lastMessage.sentAt
  }
  if (ChatBskyConvoDefs.isDeletedMessageView(convo.lastMessage)) {
    lastMessage = isDeletedAccount
      ? _(msg`Conversation deleted`)
      : _(msg`Message deleted`)
  }

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
      if (isDeletedAccount) {
        e.preventDefault()
        return false
      } else {
        logEvent('chat:open', {logContext: 'ChatsList'})
      }
    },
    [isDeletedAccount],
  )

  const onLongPress = useCallback(() => {
    playHaptic()
    menuControl.open()
  }, [playHaptic, menuControl])

  return (
    <View
      // @ts-expect-error web only
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onMouseLeave}
      style={[a.relative]}>
      <Link
        to={`/messages/${convo.id}`}
        label={displayName}
        accessibilityHint={
          !isDeletedAccount
            ? _(msg`Go to conversation with ${profile.handle}`)
            : undefined
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
        onAccessibilityAction={onLongPress}
        style={[
          web({
            cursor: isDeletedAccount ? 'default' : 'pointer',
          }),
        ]}>
        {({hovered, pressed, focused}) => (
          <View
            style={[
              a.flex_row,
              isDeletedAccount ? a.align_center : a.align_start,
              a.flex_1,
              a.px_lg,
              a.py_md,
              a.gap_md,
              (hovered || pressed || focused) &&
                !isDeletedAccount &&
                t.atoms.bg_contrast_25,
              t.atoms.border_contrast_low,
            ]}>
            <UserAvatar
              avatar={profile.avatar}
              size={52}
              moderation={moderation.ui('avatar')}
            />

            <View style={[a.flex_1, a.justify_center, web({paddingRight: 45})]}>
              <View style={[a.w_full, a.flex_row, a.align_end, a.pb_2xs]}>
                <Text
                  numberOfLines={1}
                  style={[{maxWidth: '85%'}, web([a.leading_normal])]}>
                  <Text
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
            right: a.px_lg.paddingRight,
            opacity: !gtMobile || showActions || menuControl.isOpen ? 1 : 0,
          },
        ]}
      />
    </View>
  )
}

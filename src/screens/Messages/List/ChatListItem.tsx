import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  ChatBskyConvoDefs,
  moderateProfile,
  ModerationOpts,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {Bell2Off_Filled_Corner0_Rounded as BellStroke} from '#/components/icons/Bell2'
import {useMenuControl} from '#/components/Menu'
import {Text} from '#/components/Typography'

export function ChatListItem({convo}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const {currentAccount} = useSession()
  const otherUser = convo.members.find(
    member => member.did !== currentAccount?.did,
  )
  const moderationOpts = useModerationOpts()

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
    lastMessage = _(msg`Message deleted`)
  }

  const navigation = useNavigation<NavigationProp>()
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

  const onPress = useCallback(() => {
    navigation.push('MessagesConversation', {
      conversation: convo.id,
    })
  }, [convo.id, navigation])

  return (
    <View
      // @ts-expect-error web only
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onMouseLeave}>
      <Button
        label={profile.displayName || profile.handle}
        onPress={onPress}
        style={[a.flex_1]}
        onLongPress={isNative ? menuControl.open : undefined}>
        {({hovered, pressed, focused}) => (
          <View
            style={[
              a.flex_row,
              a.flex_1,
              a.px_lg,
              a.py_md,
              a.gap_md,
              (hovered || pressed || focused) && t.atoms.bg_contrast_25,
              t.atoms.border_contrast_low,
            ]}>
            <UserAvatar
              avatar={profile.avatar}
              size={52}
              moderation={moderation.ui('avatar')}
            />
            <View style={[a.flex_1, a.flex_row, a.align_center]}>
              <View style={[a.flex_1]}>
                <View
                  style={[
                    a.flex_1,
                    a.flex_row,
                    a.align_end,
                    a.pb_2xs,
                    web([{marginTop: -2}]),
                  ]}>
                  <Text
                    numberOfLines={1}
                    style={[{maxWidth: '85%'}, web([a.leading_normal])]}>
                    <Text style={[a.text_md, t.atoms.text, a.font_bold]}>
                      {displayName}
                    </Text>
                  </Text>
                  {lastMessageSentAt && (
                    <TimeElapsed timestamp={lastMessageSentAt}>
                      {({timeElapsed}) => (
                        <Text
                          style={[
                            a.text_sm,
                            web([a.leading_normal, {whiteSpace: 'pre'}]),
                            t.atoms.text_contrast_medium,
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
                        web([a.leading_normal, {whiteSpace: 'pre'}]),
                        t.atoms.text_contrast_medium,
                      ]}>
                      {' '}
                      &middot;{' '}
                      <BellStroke
                        size="xs"
                        style={t.atoms.text_contrast_medium}
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
                    (convo.muted || moderation.blocked) &&
                      t.atoms.text_contrast_medium,
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
                      backgroundColor:
                        convo.muted || moderation.blocked
                          ? t.palette.contrast_200
                          : t.palette.primary_500,
                      height: 7,
                      width: 7,
                    },
                    isNative
                      ? {
                          top: 15,
                          right: 12,
                        }
                      : {
                          top: 0,
                          right: 0,
                        },
                  ]}
                />
              )}
              <ConvoMenu
                convo={convo}
                profile={profile}
                control={menuControl}
                currentScreen="list"
                showMarkAsRead={convo.unreadCount > 0}
                hideTrigger={isNative}
                triggerOpacity={
                  !gtMobile || showActions || menuControl.isOpen ? 1 : 0
                }
                blockInfo={blockInfo}
              />
            </View>
          </View>
        )}
      </Button>
    </View>
  )
}

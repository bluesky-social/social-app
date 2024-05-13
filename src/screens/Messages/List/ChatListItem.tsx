import React from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {Bell2Off_Filled_Corner0_Rounded as BellStroke} from '#/components/icons/Bell2'
import {useMenuControl} from '#/components/Menu'
import {Text} from '#/components/Typography'

export function ChatListItem({
  convo,
  index,
}: {
  convo: ChatBskyConvoDefs.ConvoView
  index: number
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const menuControl = useMenuControl()
  const {gtMobile} = useBreakpoints()

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

  const otherUser = convo.members.find(
    member => member.did !== currentAccount?.did,
  )

  const navigation = useNavigation<NavigationProp>()
  const [showActions, setShowActions] = React.useState(false)

  const onMouseEnter = React.useCallback(() => {
    setShowActions(true)
  }, [])

  const onMouseLeave = React.useCallback(() => {
    setShowActions(false)
  }, [])

  const onFocus = React.useCallback<React.FocusEventHandler>(e => {
    if (e.nativeEvent.relatedTarget == null) return
    setShowActions(true)
  }, [])

  const onPress = React.useCallback(() => {
    navigation.push('MessagesConversation', {
      conversation: convo.id,
    })
  }, [convo.id, navigation])

  if (!otherUser) {
    return null
  }

  return (
    <View
      // @ts-expect-error web only
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onMouseLeave}>
      <Button
        label={otherUser.displayName || otherUser.handle}
        onPress={onPress}
        style={a.flex_1}
        onLongPress={isNative ? menuControl.open : undefined}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_row,
              a.flex_1,
              a.px_lg,
              a.py_md,
              a.gap_md,
              (hovered || pressed) && t.atoms.bg_contrast_25,
              index === 0 && [a.border_t, a.pt_lg],
              t.atoms.border_contrast_low,
            ]}>
            <UserAvatar avatar={otherUser?.avatar} size={52} />
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
                      {otherUser.displayName || otherUser.handle}
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
                  {convo.muted && (
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
                <Text
                  numberOfLines={1}
                  style={[a.text_sm, t.atoms.text_contrast_medium, a.pb_xs]}>
                  @{otherUser.handle}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    convo.unreadCount > 0
                      ? a.font_bold
                      : t.atoms.text_contrast_high,
                    convo.muted && t.atoms.text_contrast_medium,
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
                      backgroundColor: convo.muted
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
                profile={otherUser}
                control={menuControl}
                currentScreen="list"
                showMarkAsRead={convo.unreadCount > 0}
                hideTrigger={isNative}
                triggerOpacity={
                  !gtMobile || showActions || menuControl.isOpen ? 1 : 0
                }
              />
            </View>
          </View>
        )}
      </Button>
    </View>
  )
}

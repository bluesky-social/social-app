import {memo} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {type $Typed, type ChatBskyEmbedJoinLink} from '@atproto/api'

import {useConvoActive} from '#/state/messages/convo'
import {isKnownJoinLinkPreview} from '#/state/queries/join-links'
import {atoms as a, native, useTheme, web} from '#/alf'
import * as ChatInvite from '#/components/dms/ChatInvite'
import {MessageContextProvider} from './MessageContext'

const BORDER_RADIUS = 20
const SQUARED_BORDER_RADIUS = 4

let MessageItemInviteEmbed = ({
  embed,
  isFromSelf,
  isGroupChat,
  squaredTopCorner,
  squaredBottomCorner,
}: {
  embed: $Typed<ChatBskyEmbedJoinLink.View>
  isFromSelf: boolean
  isGroupChat: boolean
  squaredTopCorner: boolean
  squaredBottomCorner: boolean
}): React.ReactNode => {
  const t = useTheme()
  const screen = useWindowDimensions()
  const convo = useConvoActive()

  const code = isKnownJoinLinkPreview(embed.joinLinkPreview)
    ? embed.joinLinkPreview.code
    : undefined
  if (!code) return null

  return (
    <MessageContextProvider>
      <View
        style={[
          !isFromSelf && isGroupChat && a.ml_sm,
          native({
            flexBasis: 0,
            width: Math.min(screen.width, 600) / 1.4,
          }),
          web({
            width: '100%',
            minWidth: 280,
            maxWidth: 360,
          }),
        ]}>
        <View
          style={[
            a.p_md,
            a.gap_md,
            a.overflow_hidden,
            isFromSelf
              ? {
                  backgroundColor: t.palette.primary_50,
                  borderBottomRightRadius: squaredBottomCorner
                    ? SQUARED_BORDER_RADIUS
                    : BORDER_RADIUS,
                  borderTopRightRadius: squaredTopCorner
                    ? SQUARED_BORDER_RADIUS
                    : BORDER_RADIUS,
                  borderBottomLeftRadius: BORDER_RADIUS,
                  borderTopLeftRadius: BORDER_RADIUS,
                }
              : {
                  backgroundColor: t.palette.contrast_50,
                  borderBottomLeftRadius: squaredBottomCorner
                    ? SQUARED_BORDER_RADIUS
                    : BORDER_RADIUS,
                  borderTopLeftRadius: squaredTopCorner
                    ? SQUARED_BORDER_RADIUS
                    : BORDER_RADIUS,
                  borderBottomRightRadius: BORDER_RADIUS,
                  borderTopRightRadius: BORDER_RADIUS,
                },
          ]}>
          <ChatInvite.Root
            code={code}
            initialPreview={embed.joinLinkPreview}
            currentConvoId={convo.convo.view.id}
            hasFixedHeight={false}>
            <ChatInvite.Card size="small" />
            <ChatInvite.JoinButton />
          </ChatInvite.Root>
        </View>
      </View>
    </MessageContextProvider>
  )
}
MessageItemInviteEmbed = memo(MessageItemInviteEmbed)
export {MessageItemInviteEmbed}

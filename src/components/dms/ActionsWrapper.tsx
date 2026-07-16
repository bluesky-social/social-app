import {View} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {type ModerationOpts} from '@bsky.app/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {MessageContextMenu} from '#/components/dms/MessageContextMenu'
import {useMessageReplies} from '#/components/dms/MessageReplies'
import {SwipeToReply} from '#/components/dms/SwipeToReply'
import type * as bsky from '#/types/bsky'

export function ActionsWrapper({
  message,
  isFromSelf,
  senderProfile,
  moderationOpts,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  senderProfile?: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts | undefined
  children: React.ReactNode
}) {
  const {t: l} = useLingui()
  const {setReply} = useMessageReplies()

  return (
    <SwipeToReply isFromSelf={isFromSelf} onReply={() => setReply(message)}>
      {swipeGesture => (
        <MessageContextMenu
          message={message}
          senderProfile={senderProfile}
          moderationOpts={moderationOpts}
          swipeGesture={swipeGesture}>
          {trigger =>
            // will always be true, since this file is platform split
            trigger.IS_NATIVE && (
              <View
                accessible={true}
                accessibilityActions={[
                  {name: 'activate', label: l`Open message options`},
                ]}
                onAccessibilityAction={() => trigger.control.open('full')}>
                {children}
              </View>
            )
          }
        </MessageContextMenu>
      )}
    </SwipeToReply>
  )
}

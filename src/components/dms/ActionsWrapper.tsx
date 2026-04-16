import {View} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {MessageContextMenu} from '#/components/dms/MessageContextMenu'

export function ActionsWrapper({
  message,
  isFromSelf,
  children,
  onTap,
}: {
  message: ChatBskyConvoDefs.MessageView
  hasReactions?: boolean
  isFromSelf: boolean
  children: React.ReactNode
  onTap?: () => void
}) {
  const {t: l} = useLingui()

  return (
    <MessageContextMenu message={message} onTap={onTap}>
      {trigger =>
        // will always be true, since this file is platform split
        trigger.IS_NATIVE && (
          <View style={[a.flex_1, a.relative]}>
            <View
              style={[
                {maxWidth: '80%'},
                isFromSelf
                  ? [a.self_end, a.align_end]
                  : [a.self_start, a.align_start],
              ]}
              accessible={true}
              accessibilityActions={[
                {name: 'activate', label: l`Open message options`},
              ]}
              onAccessibilityAction={() => trigger.control.open('full')}>
              {children}
            </View>
          </View>
        )
      }
    </MessageContextMenu>
  )
}

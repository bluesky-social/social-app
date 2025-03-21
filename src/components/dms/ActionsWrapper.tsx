import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {MessageContextMenu} from '#/components/dms/MessageContextMenu'

export function ActionsWrapper({
  message,
  isFromSelf,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  children: React.ReactNode
}) {
  const {_} = useLingui()

  return (
    <MessageContextMenu message={message}>
      {trigger =>
        // will always be true, since this file is platform split
        trigger.isNative && (
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
                {name: 'activate', label: _(msg`Open message options`)},
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

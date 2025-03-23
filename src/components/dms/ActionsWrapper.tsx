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
            {/* {isNative && (
              <View
                style={[
                  a.rounded_full,
                  a.absolute,
                  {bottom: '100%'},
                  isFromSelf ? a.right_0 : a.left_0,
                  t.atoms.bg,
                  a.flex_row,
                  a.shadow_lg,
                  a.py_xs,
                  a.px_md,
                  a.gap_md,
                  a.mb_xs,
                ]}>
                {['👍', '😆', '❤️', '👀', '😢'].map(emoji => (
                  <Text key={emoji} style={[a.text_center, {fontSize: 32}]}>
                    {emoji}
                  </Text>
                ))}
              </View>
            )} */}
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
              onAccessibilityAction={trigger.control.open}>
              {children}
            </View>
          </View>
        )
      }
    </MessageContextMenu>
  )
}

import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'

import {atoms as a} from '#/alf'
import {MessageMenu} from '#/components/dms/MessageMenu'
import {useMenuControl} from '#/components/Menu'

export function ActionsWrapper({
  message,
  isFromSelf,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  children: React.ReactNode
}) {
  const [showActions, setShowActions] = React.useState(false)

  const menuControl = useMenuControl()

  const onMouseEnter = React.useCallback(() => {
    setShowActions(true)
  }, [])

  const onMouseLeave = React.useCallback(() => {
    setShowActions(false)
  }, [])

  return (
    <View
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={onMouseLeave}
      style={StyleSheet.flatten([a.flex_1, a.flex_row])}>
      {isFromSelf && (
        <View
          style={[
            a.mr_md,
            {
              marginLeft: 'auto',
            },
          ]}>
          <MessageMenu
            message={message}
            control={menuControl}
            triggerOpacity={showActions ? 1 : 0}
          />
        </View>
      )}
      <View
        style={{
          maxWidth: '65%',
        }}>
        {children}
      </View>
      {!isFromSelf && (
        <View style={[a.flex_row, a.align_center, a.ml_xl]}>
          <MessageMenu
            message={message}
            control={menuControl}
            triggerOpacity={showActions ? 1 : 0}
          />
        </View>
      )}
    </View>
  )
}

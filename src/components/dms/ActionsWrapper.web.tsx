import React from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'

import {atoms as a} from '#/alf'
import {MessageMenu} from '#/components/dms/MessageMenu'
import {useMenuControl} from '#/components/Menu'
import {Text} from '#/components/Typography'

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
      style={[a.flex_1, a.flex_row]}>
      {isFromSelf && (
        <View
          style={[
            {
              width: 100,
              marginLeft: 'auto',
              alignItems: 'flex-end',
            },
          ]}>
          <ActionBar control={menuControl} message={message} />
        </View>
      )}
      <View
        style={[
          {
            maxWidth: '65%',
          },
        ]}>
        {children}
      </View>
      {!isFromSelf && (
        <View style={[{width: 100}]}>{showActions && <Text>Hello</Text>}</View>
      )}
    </View>
  )
}

function ActionBar({
  control,
  message,
}: {
  control: Menu.MenuControlProps
  message: ChatBskyConvoDefs.MessageView
}) {
  return (
    <View style={[a.flex_row, a.mx_md]}>
      <MessageMenu message={message} control={control} />
    </View>
  )
}

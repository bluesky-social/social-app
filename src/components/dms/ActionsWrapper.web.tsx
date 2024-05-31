import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'

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
  const menuControl = useMenuControl()
  const viewRef = React.useRef(null)

  const [showActions, setShowActions] = React.useState(false)

  const onMouseEnter = React.useCallback(() => {
    setShowActions(true)
  }, [])

  const onMouseLeave = React.useCallback(() => {
    setShowActions(false)
  }, [])

  // We need to handle the `onFocus` separately because we want to know if there is a related target (the element
  // that is losing focus). If there isn't that means the focus is coming from a dropdown that is now closed.
  const onFocus = React.useCallback<React.FocusEventHandler>(e => {
    if (e.nativeEvent.relatedTarget == null) return
    setShowActions(true)
  }, [])

  return (
    <View
      // @ts-expect-error web only
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onMouseLeave}
      style={StyleSheet.flatten([a.flex_1, a.flex_row])}
      ref={viewRef}>
      {isFromSelf && (
        <View
          style={[
            a.mr_xl,
            a.justify_center,
            {
              marginLeft: 'auto',
            },
          ]}>
          <MessageMenu
            message={message}
            control={menuControl}
            triggerOpacity={showActions || menuControl.isOpen ? 1 : 0}
          />
        </View>
      )}
      <View
        style={{
          maxWidth: '80%',
        }}>
        {children}
      </View>
      {!isFromSelf && (
        <View style={[a.flex_row, a.align_center, a.ml_xl]}>
          <MessageMenu
            message={message}
            control={menuControl}
            triggerOpacity={showActions || menuControl.isOpen ? 1 : 0}
          />
        </View>
      )}
    </View>
  )
}

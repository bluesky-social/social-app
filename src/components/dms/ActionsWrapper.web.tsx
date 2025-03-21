import React from 'react'
import {Pressable, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'

import {atoms as a, useTheme} from '#/alf'
import {MessageContextMenu} from '#/components/dms/MessageContextMenu'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontalIcon} from '../icons/DotGrid'

export function ActionsWrapper({
  message,
  isFromSelf,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  children: React.ReactNode
}) {
  const viewRef = React.useRef(null)
  const t = useTheme()

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
      style={[a.flex_1, isFromSelf ? a.flex_row : a.flex_row_reverse]}
      ref={viewRef}>
      <View
        style={[
          a.justify_center,
          isFromSelf
            ? [a.mr_xl, {marginLeft: 'auto'}]
            : [a.ml_xl, {marginRight: 'auto'}],
        ]}>
        <MessageContextMenu message={message}>
          {({props, state, isNative, control}) => {
            // always false, file is platform split
            if (isNative) return null
            const showMenuTrigger = showActions || control.isOpen ? 1 : 0
            return (
              <Pressable
                {...props}
                style={[
                  {opacity: showMenuTrigger},
                  a.p_sm,
                  a.rounded_full,
                  (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                ]}>
                <DotsHorizontalIcon size="md" style={t.atoms.text} />
              </Pressable>
            )
          }}
        </MessageContextMenu>
      </View>
      <View
        style={[{maxWidth: '80%'}, isFromSelf ? a.align_end : a.align_start]}>
        {children}
      </View>
    </View>
  )
}

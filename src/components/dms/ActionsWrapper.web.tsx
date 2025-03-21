import React from 'react'
import {Pressable, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'

import {atoms as a, useTheme} from '#/alf'
import {MessageContextMenu} from '#/components/dms/MessageContextMenu'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontalIcon} from '#/components/icons/DotGrid'
import {EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon} from '#/components/icons/Emoji'
import {EmojiReactionPicker} from './EmojiReactionPicker'

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
          a.flex_row,
          a.align_center,
          a.gap_xs,
          isFromSelf
            ? [a.mr_md, {marginLeft: 'auto'}]
            : [a.ml_md, {marginRight: 'auto'}],
        ]}>
        <EmojiReactionPicker message={message}>
          {({props, state, isNative, control}) => {
            // always false, file is platform split
            if (isNative) return null
            const showMenuTrigger = showActions || control.isOpen ? 1 : 0
            return (
              <Pressable
                {...props}
                style={[
                  {opacity: showMenuTrigger},
                  a.p_xs,
                  a.rounded_full,
                  (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                ]}>
                <EmojiSmileIcon
                  size="md"
                  style={t.atoms.text_contrast_medium}
                />
              </Pressable>
            )
          }}
        </EmojiReactionPicker>
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
                  a.p_xs,
                  a.rounded_full,
                  (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                ]}>
                <DotsHorizontalIcon
                  size="md"
                  style={t.atoms.text_contrast_medium}
                />
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

import {useCallback, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useConvoActive} from '#/state/messages/convo'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {MessageContextMenu} from '#/components/dms/MessageContextMenu'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontalIcon} from '#/components/icons/DotGrid'
import {EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon} from '#/components/icons/Emoji'
import {EmojiReactionPicker} from './EmojiReactionPicker'
import {hasReachedReactionLimit} from './util'

export function ActionsWrapper({
  message,
  isFromSelf,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  children: React.ReactNode
}) {
  const viewRef = useRef(null)
  const t = useTheme()
  const {_} = useLingui()
  const convo = useConvoActive()
  const {currentAccount} = useSession()

  const [showActions, setShowActions] = useState(false)

  const onMouseEnter = useCallback(() => {
    setShowActions(true)
  }, [])

  const onMouseLeave = useCallback(() => {
    setShowActions(false)
  }, [])

  // We need to handle the `onFocus` separately because we want to know if there is a related target (the element
  // that is losing focus). If there isn't that means the focus is coming from a dropdown that is now closed.
  const onFocus = useCallback<React.FocusEventHandler>(e => {
    if (e.nativeEvent.relatedTarget == null) return
    setShowActions(true)
  }, [])

  const onEmojiSelect = useCallback(
    (emoji: string) => {
      if (
        message.reactions?.find(
          reaction =>
            reaction.value === emoji &&
            reaction.sender.did === currentAccount?.did,
        )
      ) {
        convo
          .removeReaction(message.id, emoji)
          .catch(() => Toast.show(_(msg`Failed to remove emoji reaction`)))
      } else {
        if (hasReachedReactionLimit(message, currentAccount?.did)) return
        convo
          .addReaction(message.id, emoji)
          .catch(() =>
            Toast.show(_(msg`Failed to add emoji reaction`), 'xmark'),
          )
      }
    },
    [_, convo, message, currentAccount?.did],
  )

  return (
    <View
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      // @ts-expect-error web only
      onFocus={onFocus}
      onBlur={onMouseLeave}
      style={[a.flex_1, isFromSelf ? a.flex_row : a.flex_row_reverse]}
      ref={viewRef}>
      <View
        style={[
          a.justify_center,
          a.flex_row,
          a.align_center,
          isFromSelf
            ? [a.mr_xs, {marginLeft: 'auto'}, a.flex_row_reverse]
            : [a.ml_xs, {marginRight: 'auto'}],
        ]}>
        <EmojiReactionPicker message={message} onEmojiSelect={onEmojiSelect}>
          {({props, state, IS_NATIVE, control}) => {
            // always false, file is platform split
            if (IS_NATIVE) return null
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
          {({props, state, IS_NATIVE, control}) => {
            // always false, file is platform split
            if (IS_NATIVE) return null
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

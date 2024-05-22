import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import Graphemer from 'graphemer'
import TextareaAutosize from 'react-textarea-autosize'

import {MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {useSharedInputStyles} from '#/components/forms/TextField'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'

export function MessageInput({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {getDraft, clearDraft} = useMessageDraft()
  const [message, setMessage] = React.useState(getDraft)

  const inputStyles = useSharedInputStyles()
  const isComposing = React.useRef(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const onSubmit = React.useCallback(() => {
    if (message.trim() === '') {
      return
    }
    if (new Graphemer().countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(_(msg`Message is too long`))
      return
    }
    clearDraft()
    onSendMessage(message.trimEnd())
    setMessage('')
  }, [message, onSendMessage, _, clearDraft])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Don't submit the form when the Japanese or any other IME is composing
      if (isComposing.current) return
      if (e.key === 'Enter') {
        if (e.shiftKey) return
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit, isComposing],
  )

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value)
    },
    [],
  )

  useSaveMessageDraft(message)

  return (
    <View style={a.p_sm}>
      <View
        style={[
          a.flex_row,
          t.atoms.bg_contrast_25,
          {
            paddingHorizontal: a.p_sm.padding - 2,
            paddingLeft: a.p_md.padding - 2,
            borderWidth: 2,
            borderRadius: 23,
            borderColor: 'transparent',
          },
          isHovered && inputStyles.chromeHover,
          isFocused && inputStyles.chromeFocus,
        ]}
        // @ts-expect-error web only
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <TextareaAutosize
          style={StyleSheet.flatten([
            a.flex_1,
            a.px_sm,
            a.border_0,
            t.atoms.text,
            {
              paddingTop: 10,
              paddingBottom: 12,
              backgroundColor: 'transparent',
              resize: 'none',
            },
          ])}
          maxRows={12}
          placeholder={_(msg`Write a message`)}
          defaultValue=""
          value={message}
          dirName="ltr"
          autoFocus={true}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onCompositionStart={() => {
            isComposing.current = true
          }}
          onCompositionEnd={() => {
            isComposing.current = false
          }}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={_(msg`Send message`)}
          accessibilityHint=""
          style={[
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {
              height: 30,
              width: 30,
              marginTop: 5,
              backgroundColor: t.palette.primary_500,
            },
          ]}
          onPress={onSubmit}>
          <PaperPlane fill={t.palette.white} style={[a.relative, {left: 1}]} />
        </Pressable>
      </View>
    </View>
  )
}

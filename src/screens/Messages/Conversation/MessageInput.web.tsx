import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import TextareaAutosize from 'react-textarea-autosize'

import {atoms as a, useTheme} from '#/alf'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'

export function MessageInput({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void
  scrollToEnd: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [message, setMessage] = React.useState('')

  const onSubmit = React.useCallback(() => {
    if (message.trim() === '') {
      return
    }
    onSendMessage(message.trimEnd())
    setMessage('')
  }, [message, onSendMessage])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) return
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit],
  )

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value)
    },
    [],
  )

  return (
    <View style={a.p_sm}>
      <View
        style={[
          a.flex_row,
          a.py_sm,
          a.px_sm,
          a.pl_md,
          t.atoms.bg_contrast_25,
          {borderRadius: 23},
        ]}>
        <TextareaAutosize
          style={StyleSheet.flatten([
            a.flex_1,
            a.px_sm,
            a.border_0,
            t.atoms.text,
            {
              backgroundColor: 'transparent',
              resize: 'none',
              paddingTop: 4,
            },
          ])}
          maxRows={12}
          placeholder={_(msg`Write a message`)}
          defaultValue=""
          value={message}
          dirName="ltr"
          autoFocus={true}
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
            {height: 30, width: 30, backgroundColor: t.palette.primary_500},
          ]}
          onPress={onSubmit}>
          <PaperPlane fill={t.palette.white} style={[a.relative, {left: 1}]} />
        </Pressable>
      </View>
    </View>
  )
}

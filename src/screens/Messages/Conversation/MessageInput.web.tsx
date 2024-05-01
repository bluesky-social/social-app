import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import TextareaAutosize from 'react-textarea-autosize'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function MessageInput({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void
  onFocus: () => void
  onBlur: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [message, setMessage] = React.useState('')

  const onSubmit = React.useCallback(() => {
    onSendMessage(message)
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
    <View
      style={[
        a.flex_row,
        a.py_sm,
        a.px_sm,
        a.pl_md,
        a.mt_sm,
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
            paddingTop: 6,
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
        style={[
          a.rounded_full,
          a.align_center,
          a.justify_center,
          {height: 30, width: 30, backgroundColor: t.palette.primary_500},
        ]}>
        <Text style={a.text_md}>🐴</Text>
      </Pressable>
    </View>
  )
}

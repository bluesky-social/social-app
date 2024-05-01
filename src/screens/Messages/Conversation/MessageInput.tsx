import React from 'react'
import {Pressable, TextInput, View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function MessageInput({
  onSendMessage,
  onFocus,
  onBlur,
}: {
  onSendMessage: (message: string) => void
  onFocus: () => void
  onBlur: () => void
}) {
  const t = useTheme()
  const [message, setMessage] = React.useState('')

  const inputRef = React.useRef<TextInput>(null)

  const onSubmit = React.useCallback(() => {
    onSendMessage(message)
    setMessage('')
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [message, onSendMessage])

  return (
    <View
      style={[
        a.flex_row,
        a.py_sm,
        a.px_sm,
        a.rounded_full,
        a.mt_sm,
        t.atoms.bg_contrast_25,
      ]}>
      <TextInput
        accessibilityLabel="Text input field"
        accessibilityHint="Write a message"
        value={message}
        onChangeText={setMessage}
        placeholder="Write a message"
        style={[a.flex_1, a.text_sm, a.px_sm, t.atoms.text]}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholderTextColor={t.palette.contrast_500}
        keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
        ref={inputRef}
      />
      <Pressable
        accessibilityRole="button"
        style={[
          a.rounded_full,
          a.align_center,
          a.justify_center,
          {height: 30, width: 30, backgroundColor: t.palette.primary_500},
        ]}
        onPress={onSubmit}>
        <Text style={a.text_md}>🐴</Text>
      </Pressable>
    </View>
  )
}

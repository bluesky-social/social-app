import React, {ReactHTMLElement} from 'react'
import {Pressable, View} from 'react-native'
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

  const inputRef = React.useRef<ReactHTMLElement<HTMLTextAreaElement>>(null)

  const onSubmit = React.useCallback(() => {
    onSendMessage(message)
    setMessage('')
    inputRef.current?.focus?.()
  }, [message, onSendMessage])

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
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          resize: 'none',
          flex: 1,
        }}
        maxRows={12}
        accessibilityLabel={_(msg`Message input field`)}
        accessibilityHint={_(msg`Type your message here`)}
        placeholder={_(msg`Write a message`)}
        autoFocus={true}
        ref={inputRef}
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

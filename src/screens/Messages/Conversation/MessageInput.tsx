import React from 'react'
import {
  Dimensions,
  Keyboard,
  NativeSyntheticEvent,
  Pressable,
  TextInput,
  TextInputContentSizeChangeEventData,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'

export function MessageInput({
  onSendMessage,
  onFocus,
  onBlur,
}: {
  onSendMessage: (message: string) => void
  onFocus: () => void
  onBlur: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [message, setMessage] = React.useState('')
  const [maxHeight, setMaxHeight] = React.useState<number | undefined>()
  const [isInputScrollable, setIsInputScrollable] = React.useState(false)

  const {top: topInset} = useSafeAreaInsets()

  const inputRef = React.useRef<TextInput>(null)

  const onSubmit = React.useCallback(() => {
    if (message.trim() === '') {
      return
    }
    onSendMessage(message.trimEnd())
    setMessage('')
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [message, onSendMessage])

  const onInputLayout = React.useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const keyboardHeight = Keyboard.metrics()?.height ?? 0
      const windowHeight = Dimensions.get('window').height

      const max = windowHeight - keyboardHeight - topInset - 100
      const availableSpace = max - e.nativeEvent.contentSize.height

      setMaxHeight(max)
      setIsInputScrollable(availableSpace < 30)
    },
    [topInset],
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
      <TextInput
        accessibilityLabel={_(msg`Message input field`)}
        accessibilityHint={_(msg`Type your message here`)}
        placeholder={_(msg`Write a message`)}
        placeholderTextColor={t.palette.contrast_500}
        value={message}
        multiline={true}
        onChangeText={setMessage}
        style={[a.flex_1, a.text_md, a.px_sm, t.atoms.text, {maxHeight}]}
        keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
        scrollEnabled={isInputScrollable}
        blurOnSubmit={false}
        onFocus={onFocus}
        onBlur={onBlur}
        onContentSizeChange={onInputLayout}
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
        <PaperPlane fill={t.palette.white} />
      </Pressable>
    </View>
  )
}

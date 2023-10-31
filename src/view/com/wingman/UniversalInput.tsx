import React from 'react'
import {Pressable, StyleSheet, TextInput, Text} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {pressableOpacity} from 'lib/pressableOpacity'

const PALETTE = 'inverted'

// Known bugs:
// TextInput not growing on desktop,
// multiline onSubmit not working properly

export const UniversalInput = ({
  placeholder,
  onSubmit,
}: {
  placeholder: string
  onSubmit: (t: string) => void
}) => {
  const pal = usePalette(PALETTE)

  const [text, setText] = React.useState('')
  const inputRef = React.useRef<TextInput>(null)

  const onSubmitPress = React.useCallback(() => {
    onSubmit(text.trim())
    inputRef.current?.clear()
    setText('')
  }, [onSubmit, text])

  return (
    <TextInput
      ref={inputRef}
      enablesReturnKeyAutomatically
      multiline
      autoFocus
      placeholder={placeholder}
      placeholderTextColor={pal.text.color}
      returnKeyType="send"
      onKeyPress={e => {
        if (e.nativeEvent.key === 'Enter') {
          onSubmitPress()
          e.preventDefault()
        }
      }}
      onChangeText={setText}
      accessible={true}
      accessibilityLabel="Chat with AI"
      accessibilityHint={`Start having a conversation with the AI-assistant`}
      style={[
        pal.text,
        pal.view,
        pal.borderDark,
        styles.textInput,
        styles.textInputFormatting,
      ]}
    />
  )
}

export const FakeUniversalInput = ({placeholder}: {placeholder: string}) => {
  const pal = usePalette(PALETTE)

  return (
    <Pressable
      accessible={true}
      accessibilityLabel="Chat with AI"
      accessibilityHint={`Start having a conversation with the AI-assistant`}
      style={pressableOpacity([
        pal.text,
        pal.view,
        pal.borderDark,
        styles.textInput,
      ])}>
      <Text style={[styles.textInputFormatting]}>{placeholder}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  textInput: {
    width: '100%',
    maxHeight: 168,
    paddingBottom: 16,
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
  },
  textInputFormatting: {
    fontSize: 16,
    letterSpacing: 0.2,
    fontWeight: '400',
    lineHeight: 20.8, // 1.3*16
  },
})

import React from 'react'
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputSelectionChangeEventData,
  TextStyle,
} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {addStyle} from 'lib/styles'

export type TextInputRef = RNTextInput

interface TextInputProps {
  testID: string
  innerRef: React.Ref<TextInputRef>
  placeholder: string
  style: StyleProp<TextStyle>
  onChangeText: (str: string) => void
  onSelectionChange?:
    | ((e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void)
    | undefined
  onPaste: (err: string | undefined, uris: string[]) => void
}

export function TextInput({
  testID,
  innerRef,
  placeholder,
  style,
  onChangeText,
  onSelectionChange,
  children,
}: React.PropsWithChildren<TextInputProps>) {
  const pal = usePalette('default')
  style = addStyle(style, styles.input)
  return (
    <RNTextInput
      testID={testID}
      ref={innerRef}
      multiline
      scrollEnabled
      onChangeText={(str: string) => onChangeText(str)}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      placeholderTextColor={pal.colors.textLight}
      style={style}>
      {children}
    </RNTextInput>
  )
}

const styles = StyleSheet.create({
  input: {
    minHeight: 140,
  },
})

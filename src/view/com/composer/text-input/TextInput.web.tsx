import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TextInput as RNTextInput,
  TextStyle,
} from 'react-native'
import {usePalette} from '../../../lib/hooks/usePalette'
import {addStyle} from '../../../lib/addStyle'

export type TextInputRef = RNTextInput

interface TextInputProps {
  testID: string
  innerRef: React.Ref<TextInputRef>
  placeholder: string
  style: StyleProp<TextStyle>
  onChangeText: (str: string) => void
  onPaste: (err: string | undefined, uris: string[]) => void
}

export function TextInput({
  testID,
  innerRef,
  placeholder,
  style,
  onChangeText,
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

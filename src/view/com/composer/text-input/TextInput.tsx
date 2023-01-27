import React from 'react'
import {StyleProp, TextStyle} from 'react-native'
import PasteInput, {
  PastedFile,
  PasteInputRef,
} from '@mattermost/react-native-paste-input'
import {usePalette} from '../../../lib/hooks/usePalette'

export type TextInputRef = PasteInputRef

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
  onPaste,
  children,
}: React.PropsWithChildren<TextInputProps>) {
  const pal = usePalette('default')
  const onPasteInner = (err: string | undefined, files: PastedFile[]) => {
    if (err) {
      onPaste(err, [])
    } else {
      onPaste(
        undefined,
        files.map(f => f.uri),
      )
    }
  }
  return (
    <PasteInput
      testID={testID}
      ref={innerRef}
      multiline
      scrollEnabled
      onChangeText={(str: string) => onChangeText(str)}
      onPaste={onPasteInner}
      placeholder={placeholder}
      placeholderTextColor={pal.colors.textLight}
      style={style}>
      {children}
    </PasteInput>
  )
}

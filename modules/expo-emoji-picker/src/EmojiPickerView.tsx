import {requireNativeView} from 'expo'
import type * as React from 'react'

import {
  type EmojiPickerNativeViewProps,
  type EmojiPickerViewProps,
} from './EmojiPickerModule.types'

const NativeView: React.ComponentType<EmojiPickerNativeViewProps> =
  requireNativeView('EmojiPicker')

export default function EmojiPicker(props: EmojiPickerViewProps) {
  return (
    <NativeView
      {...props}
      onEmojiSelected={({nativeEvent}) => {
        props.onEmojiSelected(nativeEvent.emoji)
      }}
    />
  )
}

import {type ViewProps} from 'react-native'

export type EmojiSelectionListener = (event: {
  nativeEvent: SelectionEvent
}) => void

export type SelectionEvent = {
  emoji: string
}

export type EmojiPickerViewProps = ViewProps & {
  /*
   * Callback that will be called when an emoji is selected.
   */
  onEmojiSelected: (emoji: string) => void
}

export type EmojiPickerNativeViewProps = ViewProps & {
  onEmojiSelected: EmojiSelectionListener
}

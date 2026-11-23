import {type EmojiPickerViewProps} from './EmojiPickerModule.types'
import EmojiPickerNativeView from './EmojiPickerView'

const EmojiPicker = ({children, onEmojiSelected}: EmojiPickerViewProps) => {
  return (
    <EmojiPickerNativeView
      onEmojiSelected={emoji => {
        onEmojiSelected(emoji)
      }}>
      {children}
    </EmojiPickerNativeView>
  )
}

export default EmojiPicker

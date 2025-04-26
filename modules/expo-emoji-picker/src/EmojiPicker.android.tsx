import {type EmojiPickerViewProps} from './EmojiPickerModule.types'
import EmojiPickerNativeView from './EmojiPickerView'

const EmojiPicker = ({onEmojiSelected}: EmojiPickerViewProps) => {
  return (
    <EmojiPickerNativeView
      onEmojiSelected={emoji => {
        onEmojiSelected(emoji)
      }}
      style={styles}
    />
  )
}

const styles = {
  flex: 1,
  width: '100%',
  backgroundColor: 'white',
} as const

export default EmojiPicker

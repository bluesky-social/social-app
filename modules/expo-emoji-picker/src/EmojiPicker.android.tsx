import {useColorScheme} from 'react-native'

import {type EmojiPickerViewProps} from './EmojiPickerModule.types'
import EmojiPickerNativeView from './EmojiPickerView'

const EmojiPicker = ({onEmojiSelected}: EmojiPickerViewProps) => {
  const scheme = useColorScheme()
  return (
    <EmojiPickerNativeView
      onEmojiSelected={emoji => {
        onEmojiSelected(emoji)
      }}
      style={[styles, {backgroundColor: scheme === 'dark' ? '#000' : '#fff'}]}
    />
  )
}

const styles = {
  flex: 1,
  width: '100%',
} as const

export default EmojiPicker

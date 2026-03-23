import {useMemo} from 'react'
import {useColorScheme} from 'react-native'

import {type EmojiPickerViewProps} from './EmojiPickerModule.types'
import EmojiPickerNativeView from './EmojiPickerView'

const EmojiPicker = ({onEmojiSelected}: EmojiPickerViewProps) => {
  const scheme = useColorScheme()
  const styles = useMemo(
    () =>
      ({
        flex: 1,
        width: '100%',
        backgroundColor: scheme === 'dark' ? '#000' : '#fff',
      }) as const,
    [scheme],
  )

  return (
    <EmojiPickerNativeView
      onEmojiSelected={emoji => {
        onEmojiSelected(emoji)
      }}
      style={styles}
    />
  )
}
export default EmojiPicker

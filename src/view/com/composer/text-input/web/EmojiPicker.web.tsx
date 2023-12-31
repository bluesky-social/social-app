import React from 'react'
import Picker from '@emoji-mart/react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import {textInputWebEmitter} from '../TextInput.web'

export type Emoji = {
  aliases?: string[]
  emoticons: string[]
  id: string
  keywords: string[]
  name: string
  native: string
  shortcodes?: string
  unified: string
}

export interface EmojiPickerState {
  isOpen: boolean
  top: number
}

interface IProps {
  state: EmojiPickerState
  close: () => void
}

export function EmojiPicker({state, close}: IProps) {
  const isShiftDown = React.useRef(false)

  React.useEffect(() => {
    if (!state.isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDown.current = true
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDown.current = false
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [state.isOpen])

  const onInsert = (emoji: Emoji) => {
    textInputWebEmitter.emit('emoji-inserted', emoji)

    if (!isShiftDown.current) {
      close()
    }
  }

  if (!state.isOpen) return null

  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={close}
      accessibilityViewIsModal>
      <View style={styles.mask}>
        <TouchableWithoutFeedback
          accessibilityRole="button"
          onPress={e => e.stopPropagation()}>
          <View style={[{position: 'absolute', top: state.top}]}>
            <Picker
              data={async () => {
                return (await import('./EmojiPickerData.json')).default
              }}
              onEmojiSelect={onInsert}
              autoFocus={true}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  picker: {
    marginHorizontal: 'auto',
    paddingRight: 50,
  },
})

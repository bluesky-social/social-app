import React from 'react'
import Picker from '@emoji-mart/react'
import {
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native'
import {textInputWebEmitter} from '../TextInput.web'

const HEIGHT_OFFSET = 40
const WIDTH_OFFSET = 100
const PICKER_HEIGHT = 435 + HEIGHT_OFFSET
const PICKER_WIDTH = 350 + WIDTH_OFFSET

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
  pos: {top: number; left: number; right: number; bottom: number}
}

interface IProps {
  state: EmojiPickerState
  close: () => void
}

export function EmojiPicker({state, close}: IProps) {
  const {height, width} = useWindowDimensions()

  const isShiftDown = React.useRef(false)

  const position = React.useMemo(() => {
    const fitsBelow = state.pos.top + PICKER_HEIGHT < height
    const fitsAbove = PICKER_HEIGHT < state.pos.top
    const placeOnLeft = PICKER_WIDTH < state.pos.left
    const screenYMiddle = height / 2 - PICKER_HEIGHT / 2

    if (fitsBelow) {
      return {
        top: state.pos.top + HEIGHT_OFFSET,
      }
    } else if (fitsAbove) {
      return {
        bottom: height - state.pos.bottom + HEIGHT_OFFSET,
      }
    } else {
      return {
        top: screenYMiddle,
        left: placeOnLeft ? state.pos.left - PICKER_WIDTH : undefined,
        right: !placeOnLeft
          ? width - state.pos.right - PICKER_WIDTH
          : undefined,
      }
    }
  }, [state.pos, height, width])

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
        {/* eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors */}
        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
          <View style={[{position: 'absolute'}, position]}>
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

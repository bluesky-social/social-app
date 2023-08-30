import React from 'react'
import Picker from '@emoji-mart/react'
import {
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {textInputWebEmitter} from '../TextInput.web'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'

const MAX_WINDOW_HEIGHT = 750 // max height of the window to show the emoji picker below the composer
const windowHeight = Dimensions.get('window').height

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

export function EmojiPickerButton() {
  const pal = usePalette('default')
  const [open, setOpen] = React.useState(false)
  const onOpenChange = (o: boolean) => {
    setOpen(o)
  }
  const close = () => {
    setOpen(false)
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger style={styles.trigger}>
        <FontAwesomeIcon
          icon={['far', 'face-smile']}
          color={pal.colors.link}
          size={22}
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <EmojiPicker close={close} />
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function EmojiPicker({close}: {close: () => void}) {
  const onInsert = (emoji: Emoji) => {
    textInputWebEmitter.emit('emoji-inserted', emoji)
    close()
  }
  return (
    // eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors
    <TouchableWithoutFeedback onPress={close} accessibilityViewIsModal>
      <View style={styles.mask}>
        <View style={styles.picker}>
          <Picker
            // @ts-ignore we set emojiMartData in `emoji-mart-data.js` file
            data={window.emojiMartData}
            onEmojiSelect={onInsert}
            autoFocus={false}
          />
        </View>
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
  },
  trigger: {
    backgroundColor: 'transparent',
    border: 'none',
    paddingTop: 4,
    paddingHorizontal: 10,
    cursor: 'pointer',
  },
  picker: {
    paddingTop:
      windowHeight < MAX_WINDOW_HEIGHT
        ? Math.min(windowHeight / 2 - 250, 150)
        : 325,
    marginHorizontal: 'auto',
    paddingRight: 50,
  },
})

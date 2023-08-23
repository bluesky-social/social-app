import React from 'react'
import Picker from '@emoji-mart/react'
import {StyleSheet, View} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {textInputWebEmitter} from '../TextInput.web'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'

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
        <DropdownMenu.Content>
          <EmojiPicker
            close={() => {
              setOpen(false)
            }}
          />
        </DropdownMenu.Content>
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
    <View style={styles.mask}>
      <Picker
        // @ts-ignore we set emojiMartData in `emoji-mart-data.js` file
        data={window.emojiMartData}
        onEmojiSelect={onInsert}
        autoFocus={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  trigger: {
    backgroundColor: 'transparent',
    border: 'none',
    paddingTop: 4,
    paddingHorizontal: 10,
    cursor: 'pointer',
  },
})

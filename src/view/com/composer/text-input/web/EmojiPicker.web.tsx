import React from 'react'
import Picker from '@emoji-mart/react'
import {StyleSheet, Text, View} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
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

export function EmojiPickerButton() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger style={styles.trigger}>
        <Text style={styles.triggerText}>😀</Text>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content>
          <EmojiPicker />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function EmojiPicker() {
  const onInsert = (emoji: Emoji) => {
    textInputWebEmitter.emit('emoji-inserted', emoji)
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
    paddingHorizontal: 10,
    cursor: 'pointer',
  },
  triggerText: {
    fontSize: 24,
  },
})

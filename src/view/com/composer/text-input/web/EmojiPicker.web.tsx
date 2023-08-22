import React from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {StyleSheet, Text, View} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function EmojiPickerButton() {
  return (
    <div>
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
    </div>
  )
}

export function EmojiPicker() {
  return (
    <View style={styles.mask}>
      <Picker data={data} onEmojiSelect={console.log} autoFocus={false} />
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
  },
  triggerText: {
    fontSize: 24,
  },
})

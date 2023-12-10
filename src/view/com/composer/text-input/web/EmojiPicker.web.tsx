import React from 'react'
import Picker from '@emoji-mart/react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {textInputWebEmitter} from '../TextInput.web'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useMediaQuery} from 'react-responsive'

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
  const reducedPadding = useMediaQuery({query: '(max-height: 750px)'})
  const noPadding = useMediaQuery({query: '(max-height: 550px)'})
  const noPicker = useMediaQuery({query: '(max-height: 350px)'})

  return (
    // eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors
    <TouchableWithoutFeedback onPress={close} accessibilityViewIsModal>
      <View style={styles.mask}>
        {/* eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors */}
        <TouchableWithoutFeedback
          onPress={e => {
            e.stopPropagation() // prevent event from bubbling up to the mask
          }}>
          <View
            style={[
              styles.picker,
              {
                paddingTop: noPadding ? 0 : reducedPadding ? 150 : 325,
                display: noPicker ? 'none' : 'flex',
              },
            ]}>
            <Picker
              data={async () => {
                return (await import('./EmojiPickerData.json')).default
              }}
              onEmojiSelect={onInsert}
              autoFocus={false}
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
  },
  trigger: {
    backgroundColor: 'transparent',
    border: 'none',
    paddingTop: 4,
    paddingLeft: 12,
    paddingRight: 12,
    cursor: 'pointer',
  },
  picker: {
    marginHorizontal: 'auto',
    paddingRight: 50,
  },
})

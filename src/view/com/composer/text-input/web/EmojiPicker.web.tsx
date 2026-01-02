import React from 'react'
import {Pressable, useWindowDimensions, View} from 'react-native'
import Picker from '@emoji-mart/react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {DismissableLayer, FocusScope} from 'radix-ui/internal'

import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import {atoms as a, flatten} from '#/alf'
import {Portal} from '#/components/Portal'

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

export interface EmojiPickerPosition {
  top: number
  left: number
  right: number
  bottom: number
  nextFocusRef: React.MutableRefObject<HTMLElement> | null
}

export interface EmojiPickerState {
  isOpen: boolean
  pos: EmojiPickerPosition
}

interface IProps {
  state: EmojiPickerState
  close: () => void
  /**
   * If `true`, overrides position and ensures picker is pinned to the top of
   * the target element.
   */
  pinToTop?: boolean
}

export function EmojiPicker({state, close, pinToTop}: IProps) {
  const {_} = useLingui()
  const {height, width} = useWindowDimensions()

  const isShiftDown = React.useRef(false)

  const position = React.useMemo(() => {
    if (pinToTop) {
      return {
        top: state.pos.top - PICKER_HEIGHT + HEIGHT_OFFSET - 10,
        left: state.pos.left,
      }
    }

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
  }, [state.pos, height, width, pinToTop])

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
    <Portal>
      <FocusScope.FocusScope
        loop
        trapped
        onUnmountAutoFocus={e => {
          const nextFocusRef = state.pos.nextFocusRef
          const node = nextFocusRef?.current
          if (node) {
            e.preventDefault()
            node.focus()
          }
        }}>
        <Pressable
          accessible
          accessibilityLabel={_(msg`Close emoji picker`)}
          accessibilityHint={_(msg`Closes the emoji picker`)}
          onPress={close}
          style={[a.fixed, a.inset_0]}
        />

        <View
          style={flatten([
            a.fixed,
            a.w_full,
            a.h_full,
            a.align_center,
            a.z_10,
            {
              top: 0,
              left: 0,
              right: 0,
            },
          ])}>
          <View style={[{position: 'absolute'}, position]}>
            <DismissableLayer.DismissableLayer
              onFocusOutside={evt => evt.preventDefault()}
              onDismiss={close}>
              <Picker
                data={async () => {
                  return (await import('./EmojiPickerData.json')).default
                }}
                onEmojiSelect={onInsert}
                autoFocus={true}
              />
            </DismissableLayer.DismissableLayer>
          </View>
        </View>

        <Pressable
          accessible
          accessibilityLabel={_(msg`Close emoji picker`)}
          accessibilityHint={_(msg`Closes the emoji picker`)}
          onPress={close}
          style={[a.fixed, a.inset_0]}
        />
      </FocusScope.FocusScope>
    </Portal>
  )
}

import React from 'react'
import {AccessibilityRole, StyleProp, ViewStyle} from 'react-native'

import * as Dialog from '#/components/Dialog'
import {RadixPassThroughTriggerProps} from '#/components/Menu/types'

export type {
  GroupProps,
  ItemIconProps,
  ItemProps,
  ItemTextProps,
} from '#/components/Menu/types'

export type Measurement = {
  x: number
  y: number
  width: number
  height: number
}

export type ContextType = {
  isOpen: boolean
  measurement: Measurement | null
  open: (evt: Measurement) => void
  close: () => void
}

export type ItemContextType = {
  disabled: boolean
}

export type TriggerProps = {
  children(props: TriggerChildProps): React.ReactNode
  label: string
  hint?: string
  role?: AccessibilityRole
  style?: StyleProp<ViewStyle>
}
export type TriggerChildProps =
  | {
      isNative: true
      control: {isOpen: boolean; open: () => void}
      state: {
        hovered: false
        focused: false
        pressed: false
      }
      /**
       * We don't necessarily know what these will be spread on to, so we
       * should add props one-by-one.
       *
       * On web, these properties are applied to a parent `Pressable`, so this
       * object is empty.
       */
      props: {
        ref: null
        onPress: null
        onFocus: null
        onBlur: null
        onPressIn: null
        onPressOut: null
        accessibilityHint: null
        accessibilityLabel: string
        accessibilityRole: null
      }
    }
  | {
      isNative: false
      control: Dialog.DialogOuterProps['control']
      state: {
        hovered: false
        focused: false
        pressed: false
      }
      props: RadixPassThroughTriggerProps & {
        onPress: () => void
        onFocus: () => void
        onBlur: () => void
        onMouseEnter: () => void
        onMouseLeave: () => void
        accessibilityHint?: string
        accessibilityLabel: string
        accessibilityRole: AccessibilityRole
      }
    }

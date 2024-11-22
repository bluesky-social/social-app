import React from 'react'
import {
  AccessibilityProps,
  AccessibilityRole,
  GestureResponderEvent,
  PressableProps,
} from 'react-native'

import {TextStyleProp, ViewStyleProp} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Props as SVGIconProps} from '#/components/icons/common'

export type ContextType = {
  control: Dialog.DialogOuterProps['control']
}

export type ItemContextType = {
  disabled: boolean
}

export type RadixPassThroughTriggerProps = {
  id: string
  type: 'button'
  disabled: boolean
  ['data-disabled']: boolean
  ['data-state']: string
  ['aria-controls']?: string
  ['aria-haspopup']?: boolean
  ['aria-expanded']?: AccessibilityProps['aria-expanded']
  onKeyDown: (e: React.KeyboardEvent) => void
  /**
   * Radix provides this, but we override on web to use `onPress` instead,
   * which is less sensitive while scrolling.
   */
  onPointerDown: PressableProps['onPointerDown']
}
export type TriggerProps = {
  children(props: TriggerChildProps): React.ReactNode
  label: string
  role?: AccessibilityRole
}
export type TriggerChildProps =
  | {
      isNative: true
      control: Dialog.DialogOuterProps['control']
      state: {
        /**
         * Web only, `false` on native
         */
        hovered: false
        focused: boolean
        pressed: boolean
      }
      /**
       * We don't necessarily know what these will be spread on to, so we
       * should add props one-by-one.
       *
       * On web, these properties are applied to a parent `Pressable`, so this
       * object is empty.
       */
      props: {
        onPress: () => void
        onFocus: () => void
        onBlur: () => void
        onPressIn: () => void
        onPressOut: () => void
        accessibilityLabel: string
        accessibilityRole: AccessibilityRole
      }
    }
  | {
      isNative: false
      control: Dialog.DialogOuterProps['control']
      state: {
        hovered: boolean
        focused: boolean
        /**
         * Native only, `false` on web
         */
        pressed: false
      }
      props: RadixPassThroughTriggerProps & {
        onPress: () => void
        onFocus: () => void
        onBlur: () => void
        onMouseEnter: () => void
        onMouseLeave: () => void
        accessibilityLabel: string
        accessibilityRole: AccessibilityRole
      }
    }

export type ItemProps = React.PropsWithChildren<
  Omit<PressableProps, 'style'> &
    ViewStyleProp & {
      label: string
      onPress: (e: GestureResponderEvent) => void
    }
>

export type ItemTextProps = React.PropsWithChildren<TextStyleProp & {}>
export type ItemIconProps = React.PropsWithChildren<{
  icon: React.ComponentType<SVGIconProps>
  position?: 'left' | 'right'
}>

export type GroupProps = React.PropsWithChildren<ViewStyleProp & {}>

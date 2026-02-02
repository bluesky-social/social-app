import {
  type AccessibilityRole,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {type SharedValue} from 'react-native-reanimated'

import type * as Dialog from '#/components/Dialog'
import {
  type ItemProps as MenuItemProps,
  type RadixPassThroughTriggerProps,
} from '#/components/Menu/types'

export type {
  GroupProps,
  ItemIconProps,
  ItemTextProps,
} from '#/components/Menu/types'

export type AuxiliaryViewProps = {
  children?: React.ReactNode
  align?: 'left' | 'right'
}

export type ItemProps = Omit<MenuItemProps, 'onPress' | 'children'> & {
  // remove default styles (i.e. for emoji reactions)
  unstyled?: boolean
  onPress: (evt?: GestureResponderEvent) => void
  children?: React.ReactNode | ((hovered: boolean) => React.ReactNode)
  // absolute position of the parent element. if undefined, assumed to
  // be in the context menu. use this if using AuxiliaryView
  position?: Measurement
}

export type Measurement = {
  x: number
  y: number
  width: number
  height: number
}

export type ContextType = {
  isOpen: boolean
  measurement: Measurement | null
  /* Spring animation between 0 and 1 */
  animationSV: SharedValue<number>
  /* Translation in Y axis to ensure everything's onscreen */
  translationSV: SharedValue<number>
  mode: 'full' | 'auxiliary-only'
  open: (evt: Measurement, mode: 'full' | 'auxiliary-only') => void
  close: () => void
  registerHoverable: (
    id: string,
    rect: Measurement,
    onTouchUp: () => void,
  ) => void
  hoverablesSV: SharedValue<Record<string, {id: string; rect: Measurement}>>
  hoveredMenuItem: string | null
  setHoveredMenuItem: React.Dispatch<React.SetStateAction<string | null>>
  onTouchUpMenuItem: (id: string) => void
}

export type MenuContextType = {
  align: 'left' | 'right'
}

export type ItemContextType = {
  disabled: boolean
}

export type TriggerProps = {
  children(props: TriggerChildProps): React.ReactNode
  label: string
  /**
   * When activated, this is the accessibility label for the entire thing that has been triggered.
   * For example, if the trigger is a message bubble, use the message content.
   *
   * @platform ios, android
   */
  contentLabel: string
  hint?: string
  role?: AccessibilityRole
  style?: StyleProp<ViewStyle>
}
export type TriggerChildProps =
  | {
      IS_NATIVE: true
      control: {
        isOpen: boolean
        open: (mode: 'full' | 'auxiliary-only') => void
      }
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
      IS_NATIVE: false
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

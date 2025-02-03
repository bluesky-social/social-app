import {AccessibilityProps} from 'react-native'

import {DialogControlProps} from '#/components/Dialog'
import {Props as SVGIconProps} from '#/components/icons/common'

export type RootProps = {
  children?: React.ReactNode
  value?: string
  onValueChange?(value: string): void
  disabled?: boolean
  /**
   * @platform web
   */
  defaultValue?: string
  /**
   * @platform web
   */
  open?: boolean
  /**
   * @platform web
   */
  defaultOpen?: boolean
  /**
   * @platform web
   */
  onOpenChange?(open: boolean): void
  /**
   * @platform web
   */
  name?: string
  /**
   * @platform web
   */
  autoComplete?: string
  /**
   * @platform web
   */
  required?: boolean
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
  onPress: () => void
}

export type TriggerProps = {
  children: React.ReactNode | ((props: TriggerChildProps) => React.ReactNode)
  label: string
}

export type TriggerChildProps =
  | {
      isNative: true
      control: DialogControlProps
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
      }
    }
  | {
      isNative: false
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
      }
    }

export type ValueProps = {
  /*
   * Workaround for native limitation. Not needed on web
   *
   * @platform ios, android
   */
  children?: React.ReactNode
  placeholder?: string
}

export type ContentProps<T> = {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactElement
}

export type ItemProps = {
  value: string
  label: string
  children: React.ReactNode
}

export type ItemTextProps = {
  children: React.ReactNode
}

export type ItemIndicatorProps = {
  icon?: React.ComponentType<SVGIconProps>
}

import {
  type AccessibilityProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import {type TextStyleProp} from '#/alf'
import {type DialogControlProps} from '#/components/Dialog'
import {type Props as SVGIconProps} from '#/components/icons/common'

export type RootProps = {
  children?: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
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
  onClick: () => void
  onPointerDown: () => void
  onKeyDown: () => void
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

/*
 * For use within the `Select.Trigger` component.
 * Shows the currently selected value. You can also
 * provide a placeholder to show when no value is selected.
 *
 * If you're passing items of a different shape than {value: string, label: string},
 * you'll need to pass a function to `children` that extracts the label from an item.
 */
export type ValueProps = {
  /**
   * Only needed for native. Extracts the label from an item. Defaults to `item => item.label`
   */
  children?: (value: any) => string
  placeholder?: string
  style?: StyleProp<TextStyle>
}

/*
 * Icon for use within the `Select.Trigger` component.
 * Changes based on platform - chevron down on web, up/down chevrons on native
 *
 * `style` prop is web only
 */
export type IconProps = TextStyleProp

export type ContentProps<T> = {
  /**
   * Items to render. Recommended to be in the form {value: string, label: string} - if not,
   * you need to provide a `valueExtractor` function to extract the value from an item and
   * customise the `Select.ValueText` component.
   */
  items: T[]
  /**
   * Renders an item. You should probably use the `Select.Item` component.
   *
   * @example
   * ```tsx
   * renderItem={({label, value}) => (
   *   <Select.Item value={value} label={label}>
   *     <Select.ItemIndicator />
   *     <Select.ItemText>{label}</Select.ItemText>
   *   </Select.Item>
   * )}
   * ```
   */
  renderItem: (
    item: T,
    index: number,
    selectedValue?: string | null,
  ) => React.ReactElement
  /*
   * Extracts the value from an item. Defaults to `item => item.value`
   */
  valueExtractor?: (item: T) => string
}

/*
 * An item within the select dropdown
 */
export type ItemProps = {
  ref?: React.Ref<HTMLDivElement>
  value: string
  label: string
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export type ItemTextProps = {
  children: React.ReactNode
}

export type ItemIndicatorProps = {
  icon?: React.ComponentType<SVGIconProps>
}

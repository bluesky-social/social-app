import {
  type AccessibilityProps,
  type AccessibilityRole,
  type GestureResponderEvent,
  type PressableProps,
  type View,
} from 'react-native'

import {type TextStyleProp, type ViewStyleProp} from '#/alf'
import type * as Dialog from '#/components/Dialog'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {type BottomSheetPopoverMode} from '../../../modules/bottom-sheet'

export type ContextType = {
  control: Dialog.DialogOuterProps['control']
  /**
   * Whether this menu renders as the platform's native menu, see
   * `RootProps['inline']`. Always `false` on web.
   */
  inline: boolean
}

export type RootProps = React.PropsWithChildren<{
  control?: Dialog.DialogControlProps
  /**
   * Renders the menu as the platform's own menu, anchored to the trigger,
   * instead of a bottom sheet: SwiftUI `Menu` on iOS, Material
   * `DropdownMenu` on Android. Ignored on web, which always renders a
   * dropdown.
   *
   * Groups, items, icons, radios and labels map to their native
   * counterparts. Native menus can't host React Native views, so
   * `ContainerItem` and any custom item content are dropped, and icons only
   * show if they render as nano-icons glyphs. `Menu.Trigger` and `Menu.Outer`
   * must be direct children of `Menu.Root`, and the items must be mounted
   * before the menu opens. Otherwise the menu falls back to the bottom sheet.
   *
   * iOS menus can't be opened programmatically, so `control.open()` does
   * nothing there.
   */
  inline?: boolean
}>

export type ItemContextType = {
  disabled: boolean
  destructive: boolean
}

export type OuterProps = React.PropsWithChildren<
  ViewStyleProp & {
    showCancel?: boolean
    /**
     * iOS presentation policy. Defaults to 'adaptive'; use 'always' to keep a
     * popover on iPhone, or 'never' to use a sheet. Ignored on Android and web.
     */
    popover?: BottomSheetPopoverMode
    onCloseAutoFocus?: (event: Event) => void
  }
>

export type RadixPassThroughTriggerProps = {
  ref: React.RefObject<any>
  id: string
  type: 'button'
  disabled: boolean
  ['data-disabled']: boolean
  ['data-state']: string
  ['aria-controls']?: string
  ['aria-haspopup']?: boolean
  ['aria-expanded']?: AccessibilityProps['aria-expanded']
  onKeyDown: PressableProps['onKeyDown']
  /**
   * Radix provides this, but we override on web to use `onPress` instead,
   * which is less sensitive while scrolling.
   */
  onPointerDown: PressableProps['onPointerDown']
}
export type TriggerProps = {
  children(props: TriggerChildProps): React.ReactNode
  label: string
  hint?: string
  role?: AccessibilityRole
}
export type TriggerChildProps =
  | {
      IS_NATIVE: true
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
        ref: React.RefObject<React.ComponentRef<typeof View> | null>
        onPress: (event?: GestureResponderEvent) => void
        onFocus: () => void
        onBlur: () => void
        onPressIn: () => void
        onPressOut: () => void
        accessibilityHint?: string
        accessibilityLabel: string
        accessibilityRole: AccessibilityRole
      }
    }
  | {
      IS_NATIVE: false
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
        accessibilityHint?: string
        accessibilityLabel: string
        accessibilityRole: AccessibilityRole
      }
    }

export type ItemProps = React.PropsWithChildren<
  Omit<PressableProps, 'style'> &
    ViewStyleProp & {
      label: string
      /**
       * Inline menus have no press event, so the event is `undefined` there.
       */
      onPress: (e?: GestureResponderEvent) => void
      destructive?: boolean
    }
>

export type ItemTextProps = React.PropsWithChildren<TextStyleProp & {}>
export type ItemIconProps = React.PropsWithChildren<{
  icon: React.ComponentType<SVGIconProps>
  position?: 'left' | 'right'
  fill?: (props: {disabled: boolean}) => string
}>

export type GroupProps = React.PropsWithChildren<ViewStyleProp & {}>

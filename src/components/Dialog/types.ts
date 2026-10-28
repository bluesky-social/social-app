import {
  type AccessibilityProps,
  type GestureResponderEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {type BottomSheetViewProps} from '@bsky.app/bottom-sheet'
import {type BottomSheetSnapPoint} from '@bsky.app/bottom-sheet/src/BottomSheet.types'

import {type ViewStyleProp} from '#/alf'

type A11yProps = Required<AccessibilityProps>

/**
 * Mutated by useImperativeHandle to provide a public API for controlling the
 * dialog. The methods here will actually become the handlers defined within
 * the `Dialog.Outer` component.
 *
 * `Partial<GestureResponderEvent>` here allows us to add this directly to the
 * `onPress` prop of a button, for example. If this type was not added, we
 * would need to create a function to wrap `.open()` with.
 */
export type DialogControlRefProps = {
  open: (
    options?: DialogControlOpenOptions & Partial<GestureResponderEvent>,
  ) => void
  close: (callback?: () => void) => void
}

/**
 * The return type of the useDialogControl hook.
 */
export type DialogControlProps = DialogControlRefProps & {
  id: string
  ref: React.RefObject<DialogControlRefProps | null>
  isOpen?: boolean
}

export type DialogContextProps = {
  close: DialogControlProps['close']
  isNativeDialog: boolean
  /** Actual content width of the presented native sheet or popover. */
  availableWidth?: number
  /** Distance between the presentation bottom and the presentation window bottom. */
  presentationBottomOffset: number
  isNativePopover: boolean
  nativeSnapPoint: BottomSheetSnapPoint
  disableDrag: boolean
  /**
   * Whether user dismissal (backdrop, swipe, back, Escape, close button) is
   * currently prevented. `close` itself is never blocked.
   */
  preventDismiss: boolean
  setDisableDrag: React.Dispatch<React.SetStateAction<boolean>>
  // in the event that the hook is used outside of a dialog
  isWithinDialog: boolean
  isHeightConstrained: boolean
  /**
   * Hands the native sheet the React tag of the content's ScrollView, which it
   * uses to measure the content's natural height on iOS.
   */
  setContentScrollViewTag: (tag: number | undefined) => void
}

export type DialogControlOpenOptions = {
  /**
   * NATIVE ONLY
   *
   * Optional index of the snap point to open the bottom sheet to. Defaults to
   * 0, which is the first snap point (i.e. "open").
   */
  index?: number
  /**
   * NATIVE ONLY
   *
   * Optional source view for popover positioning or iOS 26+ zoom transitions.
   */
  sourceViewTag?: number
}

export type DialogOuterProps = {
  control: DialogControlProps
  onOpen?: () => void
  onClose?: () => void
  /**
   * Prevents the user from dismissing the dialog (backdrop press, swipe, back
   * button, Escape, and the close button), e.g. while a request is pending.
   * Does not block `control.close()`, so the pending operation can still close
   * the dialog itself when it finishes.
   *
   * @default false
   */
  preventDismiss?: boolean
  nativeOptions?: Omit<BottomSheetViewProps, 'children'>
  webOptions?: {
    alignCenter?: boolean
    onBackgroundPress?: (e: GestureResponderEvent) => void
  }
  testID?: string
}

type DialogInnerPropsBase<T> = React.PropsWithChildren<ViewStyleProp> &
  T & {
    testID?: string
    /**
     * Native only. Lets content like drag-to-reorder lists pause scrolling
     * while a gesture is active.
     */
    scrollEnabled?: ScrollViewProps['scrollEnabled']
  }
export type DialogInnerProps =
  | DialogInnerPropsBase<{
      label?: undefined
      accessibilityLabelledBy: A11yProps['aria-labelledby']
      accessibilityDescribedBy: string
      keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
      showsVerticalScrollIndicator?: ScrollViewProps['showsVerticalScrollIndicator']
      contentContainerStyle?: StyleProp<ViewStyle>
      header?: React.ReactNode
      footer?: React.ReactNode
    }>
  | DialogInnerPropsBase<{
      label: string
      accessibilityLabelledBy?: undefined
      accessibilityDescribedBy?: undefined
      keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
      showsVerticalScrollIndicator?: ScrollViewProps['showsVerticalScrollIndicator']
      contentContainerStyle?: StyleProp<ViewStyle>
      header?: React.ReactNode
      footer?: React.ReactNode
    }>

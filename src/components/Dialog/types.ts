import {
  type AccessibilityProps,
  type GestureResponderEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import {type ViewStyleProp} from '#/alf'
import {type BottomSheetViewProps} from '../../../modules/bottom-sheet'
import {type BottomSheetSnapPoint} from '../../../modules/bottom-sheet/src/BottomSheet.types'

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
  IS_NATIVEDialog: boolean
  nativeSnapPoint: BottomSheetSnapPoint
  disableDrag: boolean
  setDisableDrag: React.Dispatch<React.SetStateAction<boolean>>
  // in the event that the hook is used outside of a dialog
  isWithinDialog: boolean
}

export type DialogControlOpenOptions = {
  /**
   * NATIVE ONLY
   *
   * Optional index of the snap point to open the bottom sheet to. Defaults to
   * 0, which is the first snap point (i.e. "open").
   */
  index?: number
}

export type DialogOuterProps = {
  control: DialogControlProps
  onClose?: () => void
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
  }
export type DialogInnerProps =
  | DialogInnerPropsBase<{
      label?: undefined
      accessibilityLabelledBy: A11yProps['aria-labelledby']
      accessibilityDescribedBy: string
      keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
      contentContainerStyle?: StyleProp<ViewStyle>
      header?: React.ReactNode
    }>
  | DialogInnerPropsBase<{
      label: string
      accessibilityLabelledBy?: undefined
      accessibilityDescribedBy?: undefined
      keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
      contentContainerStyle?: StyleProp<ViewStyle>
      header?: React.ReactNode
    }>

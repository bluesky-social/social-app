import React from 'react'
import type {AccessibilityProps} from 'react-native'
import {BottomSheetProps} from '@gorhom/bottom-sheet'

import {ViewStyleProp} from '#/alf'

type A11yProps = Required<AccessibilityProps>

export type DialogExtraOpts<T> = {
  [K in keyof T]?: any
}

/**
 * Mutated by useImperativeHandle to provide a public API for controlling the
 * dialog. The methods here will actually become the handlers defined within
 * the `Dialog.Outer` component.
 */
export type DialogControlRefProps<T extends DialogExtraOpts<T> = {}> = {
  open: (options?: DialogControlOpenOptions<T>) => void
  close: (callback?: () => void) => void
}

/**
 * The return type of the useDialogControl hook.
 */
export type DialogControlProps<T extends DialogExtraOpts<T> = {}> =
  DialogControlRefProps<T> & {
    id: string
    ref: React.RefObject<DialogControlRefProps<T>>
    isOpen: boolean
    options: T
  }

export type DialogContextProps = {
  close: DialogControlProps['close']
}

export type DialogControlOpenOptions<T extends DialogExtraOpts<T> = {}> = {
  /**
   * NATIVE ONLY
   *
   * Optional index of the snap point to open the bottom sheet to. Defaults to
   * 0, which is the first snap point (i.e. "open").
   */
  index?: number
} & T

export type DialogOuterProps<T extends DialogExtraOpts<T> = {}> = {
  control: DialogControlProps<T>
  onClose?: () => void
  nativeOptions?: {
    sheet?: Omit<BottomSheetProps, 'children'>
  }
  webOptions?: {}
}

type DialogInnerPropsBase<T> = React.PropsWithChildren<ViewStyleProp> & T
export type DialogInnerProps =
  | DialogInnerPropsBase<{
      label?: undefined
      accessibilityLabelledBy: A11yProps['aria-labelledby']
      accessibilityDescribedBy: string
    }>
  | DialogInnerPropsBase<{
      label: string
      accessibilityLabelledBy?: undefined
      accessibilityDescribedBy?: undefined
    }>

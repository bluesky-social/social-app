import React from 'react'
import type {AccessibilityProps} from 'react-native'
import {BottomSheetProps} from '@gorhom/bottom-sheet'

import {ViewStyleProp} from '#/alf'

type A11yProps = Required<AccessibilityProps>

export type DialogContextProps = {
  close: () => void
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

export type DialogControlProps = {
  open: (options?: DialogControlOpenOptions) => void
  close: () => void
}

export type DialogOuterProps = {
  control: {
    ref: React.RefObject<DialogControlProps>
    open: (index?: number) => void
    close: () => void
  }
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

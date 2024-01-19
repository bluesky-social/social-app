import React from 'react'
import type {ViewStyle, AccessibilityProps} from 'react-native'
import {BottomSheetProps} from '@gorhom/bottom-sheet'

type A11yProps = Required<AccessibilityProps>

export type DialogContextProps = {
  close: () => void
}

export type DialogControlProps = {
  open: (index?: number) => void
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

type DialogInnerPropsBase<T> = React.PropsWithChildren<{
  style?: ViewStyle
}> &
  T
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

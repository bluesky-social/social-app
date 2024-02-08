import React from 'react'
import type {ViewStyle, AccessibilityProps} from 'react-native'
import {BottomSheetProps} from '@gorhom/bottom-sheet'

type A11yProps = Required<AccessibilityProps>

export type DialogParams = Record<string, any>

export type DialogContextProps<Params extends DialogParams> = {
  params: Params
  close: () => void
}

export type DialogControlProps<Params extends DialogParams> = {
  open: (params?: Params, options?: {snapIndex?: number}) => void
  close: () => void
}

export type DialogControlWithRefProps<Params extends DialogParams> = {
  ref: React.RefObject<DialogControlProps<Params>>
} & DialogControlProps<Params>

export type DialogOuterProps<Params extends DialogParams> = {
  control: DialogControlWithRefProps<Params>
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

import React from 'react'
import {ColorValue, NativeSyntheticEvent} from 'react-native'

export type BottomSheetState = 'closed' | 'closing' | 'open' | 'opening'

export enum BottomSheetSnapPoint {
  Hidden,
  Partial,
  Full,
}

export interface BottomSheetViewProps {
  children: React.ReactNode
  cornerRadius?: number
  preventDismiss?: boolean
  preventExpansion?: boolean
  containerBackgroundColor?: ColorValue
  topInset?: number
  bottomInset?: number

  minHeight?: number
  maxHeight?: number

  onAttemptDismiss?: (event: NativeSyntheticEvent<object>) => void
  onSnapPointChange?: (
    event: NativeSyntheticEvent<{snapPoint: BottomSheetSnapPoint}>,
  ) => void
  onStateChange?: (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => void
}

import React from 'react'
import {ColorValue, NativeSyntheticEvent} from 'react-native'

export type BottomSheetState = 'closed' | 'closing' | 'open' | 'opening'

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

  onStateChange?: (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => void
  onAttemptDismiss?: (event: NativeSyntheticEvent<object>) => void
}

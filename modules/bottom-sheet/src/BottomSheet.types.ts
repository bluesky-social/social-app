import {type ColorValue, type NativeSyntheticEvent} from 'react-native'

export type BottomSheetState = 'closed' | 'closing' | 'open' | 'opening'

export enum BottomSheetSnapPoint {
  Hidden,
  Partial,
  Full,
}

export type BottomSheetAttemptDismissEvent = NativeSyntheticEvent<object>
export type BottomSheetSnapPointChangeEvent = NativeSyntheticEvent<{
  snapPoint: BottomSheetSnapPoint
}>
export type BottomSheetStateChangeEvent = NativeSyntheticEvent<{
  state: BottomSheetState
}>
export type BottomSheetPresentationSizeChangeEvent = NativeSyntheticEvent<{
  width: number
  height: number
  /** Whether UIKit is currently presenting this surface as a floating popover. */
  isPopover: boolean
  /**
   * Insets inside the reported content frame. Popovers report zero because
   * their host is already safe-area inset.
   */
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /**
   * Distance between the reported content frame's bottom and the presentation
   * window's bottom.
   */
  bottomOffset: number
}>

export interface BottomSheetViewProps {
  children: React.ReactNode
  cornerRadius?: number
  preventDismiss?: boolean
  preventExpansion?: boolean
  backgroundColor?: ColorValue
  containerBackgroundColor?: ColorValue
  disableDrag?: boolean
  sourceViewTag?: number
  /**
   * Present as an anchored iOS popover when the current size class allows it.
   * UIKit adapts this to a form sheet in compact environments.
   */
  popover?: boolean
  /**
   * Preferred width for iOS popovers, in points. Defaults to 320.
   */
  popoverWidth?: number

  fullHeight?: boolean
  minHeight?: number
  maxHeight?: number
  /** Intrinsic content height used to size the sheet when its viewport is constrained. */
  desiredContentHeight?: number

  onAttemptDismiss?: (event: BottomSheetAttemptDismissEvent) => void
  onSnapPointChange?: (event: BottomSheetSnapPointChangeEvent) => void
  onStateChange?: (event: BottomSheetStateChangeEvent) => void
  onPresentationSizeChange?: (
    event: BottomSheetPresentationSizeChangeEvent,
  ) => void
}

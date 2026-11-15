import {type BottomSheetPopoverMode} from '../../../modules/bottom-sheet'

/**
 * Content-sized sheet measurement is needed on iPad to avoid measuring the
 * full-height canvas, and for iOS popovers (including their compact-width
 * sheet adaptations) so the presentation sizes itself to the dialog content.
 */
export function shouldMeasureDialogContentHeight({
  isIOS,
  isIPad,
  popover = 'never',
}: {
  isIOS: boolean
  isIPad: boolean
  popover?: BottomSheetPopoverMode
}) {
  return isIPad || (isIOS && popover !== 'never')
}

/**
 * Returns the measured intrinsic height only for dialogs that opt into the
 * JavaScript measurement path.
 */
export function getMeasuredDialogContentHeight({
  shouldMeasureContentHeight,
  contentHeight,
  footerHeight,
}: {
  shouldMeasureContentHeight: boolean
  contentHeight: number
  footerHeight: number
}) {
  return shouldMeasureContentHeight && contentHeight > 0
    ? contentHeight + footerHeight
    : undefined
}

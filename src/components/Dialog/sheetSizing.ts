/**
 * Content-sized sheet measurement is needed on iPad to avoid measuring the
 * full-height canvas, and for iOS popovers so their compact-width sheet
 * adaptation can size itself to the dialog content.
 */
export function shouldMeasureDialogContentHeight({
  isIOS,
  isIPad,
  popover,
}: {
  isIOS: boolean
  isIPad: boolean
  popover?: boolean
}) {
  return isIPad || (isIOS && popover === true)
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

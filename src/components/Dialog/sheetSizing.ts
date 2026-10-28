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

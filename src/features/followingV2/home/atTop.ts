/**
 * How close to its resting offset counts as the top of the list. That offset
 * is 0 where the header's space is padding in the content, and negative where
 * the platform applies it as an inset, so a small positive bound reads as the
 * top under both. Provisional, to be measured on device.
 */
export const SETTLE_AT_TOP_LIMIT = 5

/** Whether the list counts as at its top (see {@link SETTLE_AT_TOP_LIMIT}). */
export function isAtTop(offsetY: number) {
  return offsetY <= SETTLE_AT_TOP_LIMIT
}

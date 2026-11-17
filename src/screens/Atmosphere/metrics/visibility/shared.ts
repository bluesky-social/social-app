/** How long a card must stay visible to count as seen. */
export const MIN_VISIBLE_MS = 500

/**
 * Whether an element counts as visible: at least half of it in view or, for
 * one bigger than the viewport, half the viewport covered by it.
 */
export function isMostlyVisible({
  visibleArea,
  elementArea,
  viewportArea,
}: {
  visibleArea: number
  elementArea: number
  viewportArea: number
}) {
  return (
    visibleArea > 0 && visibleArea >= Math.min(elementArea, viewportArea) / 2
  )
}

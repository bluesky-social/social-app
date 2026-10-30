import {ITEM_GAP} from '#/components/Gallery/const'

export function getOffsetForIndex(
  itemWidths: Map<number, number>,
  index: number,
): number {
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += (itemWidths.get(i) ?? 0) + ITEM_GAP
  }
  return offset
}

/**
 * The index of the item the carousel is on at a given scroll offset: the
 * first one that's still more than halfway in view.
 */
export function getIndexForOffset(
  itemWidths: Map<number, number>,
  offset: number,
  itemCount: number,
): number {
  let accumulated = 0
  for (let i = 0; i < itemCount; i++) {
    const w = (itemWidths.get(i) ?? 0) + ITEM_GAP
    if (offset < accumulated + w / 2) {
      return i
    }
    accumulated += w
  }
  return Math.max(0, itemCount - 1)
}

/**
 * Total width of all items and the gaps between them (no leading or trailing
 * padding).
 */
export function getTotalWidth(
  itemWidths: Map<number, number>,
  itemCount: number,
): number {
  if (itemCount <= 0) return 0
  return (
    getOffsetForIndex(itemWidths, itemCount - 1) +
    (itemWidths.get(itemCount - 1) ?? 0)
  )
}

/**
 * The furthest the content can scroll. Any leading and trailing padding is
 * balanced out by the viewport being as wide as the padding plus the visible
 * content area, so it doesn't appear here.
 */
export function getMaxOffset(
  itemWidths: Map<number, number>,
  itemCount: number,
  viewportWidth: number,
): number {
  return Math.max(0, getTotalWidth(itemWidths, itemCount) - viewportWidth)
}

/**
 * The scroll offset that brings an item into view with the least movement.
 *
 * - Fully visible items don't move.
 * - Items off either side move just far enough to sit flush with that side.
 * - Items wider than the viewport can't fit, so they align their leading edge
 *   (rather than alternating between edges depending on where we came from).
 *
 * The result is clamped to the scrollable range. `viewportWidth` is the width
 * of the visible content area, i.e. excluding any bleed padding.
 */
export function getRevealOffset({
  itemWidths,
  itemCount,
  index,
  viewportWidth,
  currentOffset,
}: {
  itemWidths: Map<number, number>
  itemCount: number
  index: number
  viewportWidth: number
  currentOffset: number
}): number {
  if (!Number.isInteger(index) || index < 0 || index >= itemCount) {
    return currentOffset
  }
  const itemWidth = itemWidths.get(index) ?? 0
  const start = getOffsetForIndex(itemWidths, index)
  const end = start + itemWidth - viewportWidth
  let next: number
  if (itemWidth > viewportWidth) {
    next = start
  } else if (currentOffset > start) {
    next = start
  } else if (currentOffset < end) {
    next = end
  } else {
    next = currentOffset
  }
  const max = getMaxOffset(itemWidths, itemCount, viewportWidth)
  return Math.max(0, Math.min(next, max))
}

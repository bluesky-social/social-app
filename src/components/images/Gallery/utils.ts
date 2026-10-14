import {ITEM_GAP} from '#/components/images/Gallery/const'

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
 * The index of the image the carousel is on at a given scroll offset: the
 * first one that's still more than halfway in view.
 */
export function getIndexForOffset(
  itemWidths: Map<number, number>,
  offset: number,
  imageCount: number,
): number {
  let accumulated = 0
  for (let i = 0; i < imageCount; i++) {
    const w = (itemWidths.get(i) ?? 0) + ITEM_GAP
    if (offset < accumulated + w / 2) {
      return i
    }
    accumulated += w
  }
  return Math.max(0, imageCount - 1)
}

export function getAspectRatio({
  width,
  height,
}: {width?: number; height?: number} = {}) {
  if (width && width > 0 && height && height > 0) {
    return width / height
  }
  return undefined
}

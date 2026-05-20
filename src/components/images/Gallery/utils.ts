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

export function getAspectRatio({
  width,
  height,
}: {width?: number; height?: number} = {}) {
  if (width && width > 0 && height && height > 0) {
    return width / height
  }
  return undefined
}

import {
  MAX_ASPECT_RATIO,
  MIN_ASPECT_RATIO,
} from '#/components/images/Gallery/const'

/**
 * Width of a carousel tile at a fixed height, derived from the image aspect
 * ratio and clamped to the same range the viewing-side carousel uses so tiles
 * stay a reasonable size. Falls back to square when dimensions are missing.
 */
export function getCarouselTileWidth(
  dims: {width: number; height: number},
  tileHeight: number,
): number {
  const raw = dims.width > 0 && dims.height > 0 ? dims.width / dims.height : 1
  const clamped = Math.max(MIN_ASPECT_RATIO, Math.min(raw, MAX_ASPECT_RATIO))
  return Math.round(tileHeight * clamped)
}

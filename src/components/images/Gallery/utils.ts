import {
  MAX_ASPECT_RATIO,
  MIN_ASPECT_RATIO,
} from '#/components/images/Gallery/const'

export function getAspectRatio({
  width,
  height,
}: {width?: number; height?: number} = {}) {
  if (width && width > 0 && height && height > 0) {
    return width / height
  }
  return undefined
}

/**
 * The height every image in the carousel is shown at. Chat messages are the
 * smallest, followed by quotes, then ordinary posts, each growing with the
 * breakpoint.
 */
export function getContentHeight({
  isWithinChat,
  isWithinQuote,
  gtPhone,
  gtMobile,
}: {
  isWithinChat: boolean
  isWithinQuote?: boolean
  gtPhone: boolean
  gtMobile: boolean
}) {
  if (isWithinChat) {
    return 120
  }
  if (isWithinQuote) {
    if (gtMobile) {
      return 220
    } else if (gtPhone) {
      return 190
    } else {
      return 150
    }
  }
  if (gtMobile) {
    return 300
  } else if (gtPhone) {
    return 260
  } else {
    return 200
  }
}

export function computeDims({
  height,
  aspectRatio,
}: {
  height: number
  aspectRatio?: number
}) {
  /*
   * Old images, or images from other clients can sometimes not have
   * aspectRatio populated. In these cases, default to square and we'll
   * resize once the image loads.
   *
   * Clamp between MIN_ASPECT_RATIO (portrait) and MAX_ASPECT_RATIO
   * (landscape) so items stay a reasonable size in the carousel.
   */
  const raw = aspectRatio ?? 1
  const clamped = Math.max(MIN_ASPECT_RATIO, Math.min(raw, MAX_ASPECT_RATIO))
  const width = Math.floor(height * clamped)
  return {width, height, aspectRatio: clamped, isCropped: raw !== clamped}
}

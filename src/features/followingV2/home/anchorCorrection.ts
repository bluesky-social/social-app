/**
 * How far apart a scroll event's offset change and content height change can
 * be, in points, for it to still count as one anchor correction.
 *
 * `maintainVisibleContentPosition` moves the offset by exactly as far as the
 * anchored row moved, and reports it in a scroll event of its own, sent with
 * the commit that changed the content: iOS forces one, and Android's
 * `scrollTo` fires one. On device, that event's offset change matched the
 * anchor's shift to within a point, so the two changes differ by little more
 * than the rounding of two laid-out values to the pixel grid. Two points
 * covers that on any screen density. Anything looser starts to take ordinary
 * scrolling for a correction: during a fast scroll, rows mounting below the
 * viewport can grow the content by about as much as the user moves in a
 * frame, which the prototype's 150 pt tolerance couldn't tell apart.
 */
export const ANCHOR_CORRECTION_TOLERANCE = 2

/**
 * Smaller changes in content height than this, in points, are layout noise
 * rather than a correction. iOS doesn't correct for them either.
 */
const MIN_CONTENT_CHANGE = 0.5

/**
 * The anchor correction in a scroll event, in points: how much the content
 * height changed if the offset moved with it, or 0 if this event has none.
 *
 * A correction moves the offset by however much the content grew or shrank
 * above the anchored row, so the two change together, in either direction.
 * Content growing below the viewport changes the height but leaves the offset
 * wherever the user put it, so isn't one. Within the tolerance, what's left
 * of the offset's change is the user's own movement in the same event, so the
 * correction is the height's change, not the offset's.
 *
 * Content changing above and below the anchor in the same event can't be
 * told apart from the user's movement, so it isn't absorbed.
 */
export function anchorCorrection({
  contentChange,
  offsetChange,
}: {
  /** Change in `contentSize.height` since the previous scroll event. */
  contentChange: number
  /** Change in raw `contentOffset.y` since the previous scroll event. */
  offsetChange: number
}): number {
  'worklet'
  if (Math.abs(contentChange) <= MIN_CONTENT_CHANGE) {
    return 0
  }
  if (Math.abs(offsetChange - contentChange) > ANCHOR_CORRECTION_TOLERANCE) {
    return 0
  }
  return contentChange
}

/**
 * What's kept between one list's scroll events.
 */
export type AnchorCorrectionState = {
  /**
   * The corrections since the current drag began, summed, in points. Null
   * without a drag or the momentum after one: `MainScrollProvider` only
   * measures movement from where a drag began, so there's nothing for a
   * correction to distort then.
   */
  shift: number | null
  /** The last event's raw `contentOffset.y`, to measure the next against. */
  offsetY: number | null
  /** The last event's `contentSize.height`, to measure the next against. */
  contentHeight: number | null
}

export const INITIAL_ANCHOR_CORRECTION_STATE: AnchorCorrectionState = {
  shift: null,
  offsetY: null,
  contentHeight: null,
}

/**
 * Which of a list's scroll handlers an event came to.
 */
export type ScrollEventKind = 'beginDrag' | 'scroll' | 'endDrag' | 'momentumEnd'

/**
 * Takes one scroll event: returns the state after it, and the offset to report
 * for it, which is its own with the corrections since the drag began taken
 * off, so that it only moves as far as the user has.
 *
 * A drag starts the sum at zero, and each scroll event during it, or during
 * the momentum after it, adds its correction. It's dropped where
 * `MainScrollProvider` drops its drag origin: at a drag's end without
 * velocity, or at momentum's end. Those events still report with the shift
 * taken off, as they're where `MainScrollProvider` decides which way the user
 * went.
 */
export function absorbAnchorCorrection(
  state: AnchorCorrectionState,
  kind: ScrollEventKind,
  event: {
    contentOffset: {y: number}
    contentSize: {height: number}
    velocity?: {y: number}
  },
): {state: AnchorCorrectionState; offsetY: number} {
  'worklet'
  const offsetY = event.contentOffset.y
  const contentHeight = event.contentSize.height
  let shift = kind === 'beginDrag' ? 0 : state.shift
  if (
    kind === 'scroll' &&
    shift !== null &&
    state.offsetY !== null &&
    state.contentHeight !== null
  ) {
    shift += anchorCorrection({
      contentChange: contentHeight - state.contentHeight,
      offsetChange: offsetY - state.offsetY,
    })
  }
  const ends =
    kind === 'momentumEnd' || (kind === 'endDrag' && !event.velocity?.y)
  return {
    state: {shift: ends ? null : shift, offsetY, contentHeight},
    offsetY: offsetY - (shift ?? 0),
  }
}

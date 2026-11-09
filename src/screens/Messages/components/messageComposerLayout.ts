import {space} from '#/alf/tokens'

/** Keep a gutter when the containing window has no bottom safe-area inset. */
export function getMessageComposerHorizontalPadding(bottomInset: number) {
  return [bottomInset || space.md, space.md]
}

/**
 * Keep the keyboard offset from consuming the composer's minimum bottom gap.
 * The closed composer sits `bottomGap` from the bottom of the screen, which by
 * default matches the bottom safe area inset (with a minimum).
 */
export function getMessageComposerKeyboardOffsets(
  bottomInset: number,
  bottomGap = Math.max(bottomInset, space.lg),
) {
  const stickyViewClosedOffset = bottomInset + space.lg - bottomGap

  return {
    stickyViewClosedOffset,
    chatScrollOffset: bottomInset - stickyViewClosedOffset,
  }
}

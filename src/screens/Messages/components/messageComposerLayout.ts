import {space} from '#/alf/tokens'

/** Keep a gutter when the containing window has no bottom safe-area inset. */
export function getMessageComposerHorizontalPadding(bottomInset: number) {
  return [bottomInset || space.md, space.md]
}

/** Keep the keyboard offset from consuming the composer's minimum bottom gap. */
export function getMessageComposerKeyboardOffsets(bottomInset: number) {
  const stickyViewClosedOffset = Math.min(bottomInset, space.lg)

  return {
    stickyViewClosedOffset,
    chatScrollOffset: bottomInset - stickyViewClosedOffset,
  }
}

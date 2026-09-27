import {space} from '#/alf/tokens'

/** Keep a gutter when the containing window has no bottom safe-area inset. */
export function getMessageComposerHorizontalPadding(bottomInset: number) {
  return [bottomInset || space.md, space.md]
}

import {space} from '#/alf/tokens'

/**
 * The size of the avatars in an `AvatarRow`. Smaller than `Item.Avatar` by
 * enough that the two don't read as the same kind of thing.
 */
export const PREVIEW_AVATAR_SIZE = 28

/**
 * Space between the avatars in an `AvatarRow`, and before its toggle.
 */
export const AVATAR_GAP = space.sm

/**
 * Padding after the toggle's contents, the "+N" count and the chevron, to
 * make it easier to hit. There's none before them, so they sit an
 * `AVATAR_GAP` after the avatars, as the avatars do after each other.
 */
export const TOGGLE_PADDING_END = 8

/**
 * The size of the toggle's chevron, between the `2xs` and `xs` icon sizes.
 */
export const CHEVRON_SIZE = 10

/**
 * Space between the toggle's "+N" count and its chevron.
 */
export const COUNT_GAP = space.xs

/**
 * How much room each character of the toggle's "+N" count is allowed. The
 * count doesn't scale with the font size, and this is wider than a digit,
 * "+", "." or a compact suffix like "K" are at its size, so it errs on the
 * side of room to spare. A wide character, e.g. the "万" in "+1.2万", can go
 * over, but it's never the only one, and the narrow ones around it make up
 * for it.
 */
export const COUNT_CHAR_WIDTH = 10

/**
 * How many avatars an `AvatarRow` that's `width` wide can show, out of the
 * `resolved` profiles it has for the group's `total` other people. It ends
 * with the toggle, if `hasToggle`. `formatRemaining` gives the toggle's "+N"
 * for everyone the row leaves out, e.g. "+21" or "+1.2K".
 *
 * Shows as many as fit, never more, so the row can't overflow. When everyone
 * fits there's no "+N", so the toggle only needs room for the chevron.
 * Otherwise it leaves room for the "+N" it would show, which the text's
 * length decides.
 */
export function fitAvatarCount({
  width,
  resolved,
  total,
  hasToggle,
  formatRemaining,
}: {
  width: number
  resolved: number
  total: number
  hasToggle: boolean
  formatRemaining: (remaining: number) => string
}) {
  const perAvatar = PREVIEW_AVATAR_SIZE + AVATAR_GAP
  if (!hasToggle) {
    // No toggle, so no gap after the last avatar either
    const fit = Math.floor((width + AVATAR_GAP) / perAvatar)
    return Math.min(Math.max(fit, 0), resolved)
  }

  const chevronOnly = CHEVRON_SIZE + TOGGLE_PADDING_END
  if (resolved >= total && resolved * perAvatar + chevronOnly <= width) {
    return resolved
  }
  /*
   * Each avatar left out adds one to the "+N", which can make it longer, so
   * each count is checked against the "+N" it would show
   */
  for (let count = Math.min(resolved, total - 1); count > 0; count--) {
    const label = formatRemaining(total - count)
    const toggle =
      label.length * COUNT_CHAR_WIDTH +
      COUNT_GAP +
      CHEVRON_SIZE +
      TOGGLE_PADDING_END
    if (count * perAvatar + toggle <= width) {
      return count
    }
  }
  return 0
}

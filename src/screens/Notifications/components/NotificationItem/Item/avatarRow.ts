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
 * Padding either side of the toggle's chevron. With a "+N" chip, the chip
 * takes the place of the left padding.
 */
export const TOGGLE_PADDING = 8

/**
 * The size of the toggle's chevron, the `sm` icon size.
 */
export const CHEVRON_SIZE = 16

/**
 * Space between the toggle's "+N" chip and its chevron.
 */
export const CHIP_GAP = space.xs

/**
 * How many avatars an `AvatarRow` that's `width` wide can show, out of the
 * `resolved` profiles it has for the group's `total` other people. It ends
 * with the toggle, if `hasToggle`.
 *
 * Shows as many as fit, never more, so the row can't overflow. When everyone
 * fits there's no "+N" chip, so the toggle only needs room for the chevron.
 * Otherwise it leaves room for the chip as well.
 */
export function fitAvatarCount({
  width,
  resolved,
  total,
  hasToggle,
}: {
  width: number
  resolved: number
  total: number
  hasToggle: boolean
}) {
  const perAvatar = PREVIEW_AVATAR_SIZE + AVATAR_GAP
  const chevronOnly = hasToggle
    ? TOGGLE_PADDING + CHEVRON_SIZE + TOGGLE_PADDING
    : // No toggle, so no gap after the last avatar either
      -AVATAR_GAP
  if (resolved >= total && resolved * perAvatar + chevronOnly <= width) {
    return resolved
  }
  const withChip =
    PREVIEW_AVATAR_SIZE + CHIP_GAP + CHEVRON_SIZE + TOGGLE_PADDING
  const fit = Math.floor((width - withChip) / perAvatar)
  return Math.min(Math.max(fit, 0), resolved)
}

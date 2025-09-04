import {type I18n} from '@lingui/core'

/**
 * This matches `formatCount` from `view/com/util/numeric/format.ts`, but has
 * additional truncation logic for large numbers. `roundingMode` should always
 * match the original impl, regardless of if we add more formatting here.
 */
export function formatPostStatCount(
  i18n: I18n,
  count: number,
  {
    compact = false,
  }: {
    compact?: boolean
  } = {},
): string {
  const isOver10k = count >= 10_000
  return i18n.number(count, {
    notation: 'compact',
    maximumFractionDigits: isOver10k || compact ? 0 : 1,
    // @ts-expect-error - roundingMode not in the types
    roundingMode: 'trunc',
  })
}

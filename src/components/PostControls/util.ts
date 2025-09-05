import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

/**
 * This matches `formatCount` from `view/com/util/numeric/format.ts`, but has
 * additional truncation logic for large numbers. `roundingMode` should always
 * match the original impl, regardless of if we add more formatting here.
 */
export function useFormatPostStatCount() {
  const {i18n} = useLingui()

  return useCallback(
    (postStatCount: number) => {
      const isOver1k = postStatCount >= 1_000
      const isOver10k = postStatCount >= 10_000
      const isOver1M = postStatCount >= 1_000_000
      const formatted = i18n.number(postStatCount, {
        notation: 'compact',
        maximumFractionDigits: isOver10k ? 0 : 1,
        // @ts-expect-error - roundingMode not in the types
        roundingMode: 'trunc',
      })
      const count = formatted.replace(/\D+$/g, '')

      if (isOver1M) {
        return i18n._(
          msg({
            message: `${count}M`,
            comment:
              'For post statistics. Indicates a number in the millions. Please use the shortest format appropriate for your language.',
          }),
        )
      } else if (isOver1k) {
        return i18n._(
          msg({
            message: `${count}K`,
            comment:
              'For post statistics. Indicates a number in the thousands. Please use the shortest format appropriate for your language.',
          }),
        )
      } else {
        return count
      }
    },
    [i18n],
  )
}

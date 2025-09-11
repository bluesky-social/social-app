import {useCallback} from 'react'
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
      const isOver10k = postStatCount >= 10_000
      return i18n.number(postStatCount, {
        notation: 'compact',
        maximumFractionDigits: isOver10k ? 0 : 1,
        // @ts-expect-error - roundingMode not in the types
        roundingMode: 'trunc',
      })
    },
    [i18n],
  )
}

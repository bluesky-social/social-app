import type {I18n} from '@lingui/core'

import {isWeb} from '#/platform/detection'

// `@formatjs/intl-numberformat/polyfill` doesn't support `roundingMode`
const truncateRounding = (num: number): number => {
  if (num < 1_000) {
    return num
  }

  const factor = Math.floor((Math.log10(num) - 3) / 3) * 3 + 2
  const pow = 10 ** factor

  return Math.trunc(num / pow) * pow
}

export const formatCount = (i18n: I18n, num: number) => {
  return i18n.number(isWeb ? num : truncateRounding(num), {
    notation: 'compact',
    maximumFractionDigits: 1,
    // `1,953` shouldn't be rounded up to 2k, it should be truncated.
    // @ts-expect-error: `roundingMode` doesn't seem to be in the typings yet
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#roundingmode
    roundingMode: 'trunc',
  })
}

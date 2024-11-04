import type {I18n} from '@lingui/core'

export const formatCount = (
  i18n: I18n,
  num: number,
  notation: Intl.NumberFormatOptions['notation'] = 'compact',
): string => {
  return i18n.number(num, {
    notation,
    maximumFractionDigits: 1,
    // `1,953` shouldn't be rounded up to 2k, it should be truncated.
    // @ts-expect-error: `roundingMode` doesn't seem to be in the typings yet
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#roundingmode
    roundingMode: 'trunc',
  })
}

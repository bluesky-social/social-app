import type {I18n} from '@lingui/core'

export const formatCount = (i18n: I18n, num: number) => {
  return i18n.number(num, {
    notation: 'compact',
    maximumFractionDigits: 1,
    // `1,953` shouldn't be rounded up to 2k, it should be truncated.
    roundingMode: 'trunc',
  })
}

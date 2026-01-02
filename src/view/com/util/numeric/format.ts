import {type I18n} from '@lingui/core'

export const formatCount = (i18n: I18n, num: number) => {
  return i18n.number(num, {
    notation: 'compact',
    maximumFractionDigits: 1,
    // @ts-expect-error - roundingMode not in the types
    roundingMode: 'trunc',
  })
}

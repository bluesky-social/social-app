import {describe, expect, it} from '@jest/globals'

import {APP_LANGUAGES} from '#/locale/languages'
import {formatCount} from '../format'

const formatCountRound = (locale: string, num: number) => {
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
  }
  return new Intl.NumberFormat(locale, options).format(num)
}

const formatCountTrunc = (locale: string, num: number) => {
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
    // @ts-ignore
    roundingMode: 'trunc',
  }
  return new Intl.NumberFormat(locale, options).format(num)
}

// prettier-ignore
const testNums = [
  1,
  5,
  9,
  11,
  55,
  99,
  111,
  555,
  999,
  1111,
  5555,
  9999,
  11111,
  55555,
  99999,
  111111,
  555555,
  999999,
  1111111,
  5555555,
  9999999,
  11111111,
  55555555,
  99999999,
  111111111,
  555555555,
  999999999,
  1111111111,
  5555555555,
  9999999999,
  11111111111,
  55555555555,
  99999999999,
  111111111111,
  555555555555,
  999999999999,
  1111111111111,
  5555555555555,
  9999999999999,
  11111111111111,
  55555555555555,
  99999999999999,
  111111111111111,
  555555555555555,
  999999999999999,
  1111111111111111,
  5555555555555555,
]

describe('formatCount', () => {
  for (const appLanguage of APP_LANGUAGES) {
    const locale = appLanguage.code2
    it('truncates for ' + locale, () => {
      const mockI8nn = {
        locale,
        number(num: number) {
          return formatCountRound(locale, num)
        },
      }
      for (const num of testNums) {
        const formatManual = formatCount(mockI8nn as any, num)
        const formatOriginal = formatCountTrunc(locale, num)
        expect(formatManual).toEqual(formatOriginal)
      }
    })
  }
})

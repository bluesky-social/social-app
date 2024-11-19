import {I18n} from '@lingui/core'

import {AppLanguage} from '#/locale/languages'

const truncateRounding = (num: number, factors: Array<number>): number => {
  for (const factor of factors.reverse()) {
    if (num >= 10 ** factor) {
      if (factor === 10) {
        // Exception for ES and CA langs
        return Math.floor(num / 10 ** (factor - 2)) * 10 ** (factor - 2)
      }
      return Math.floor(num / 10 ** (factor - 1)) * 10 ** (factor - 1)
    }
  }
  return num
}

export const formatCount = (i18n: I18n, num: number) => {
  const koFactors = [3, 4, 8]
  const hiFactors = [3, 5, 7, 9]
  const esCaFactors = [3, 6, 10]
  const itDeFactors = [6, 9]
  const jaZhFactors = [4, 8]
  const normalFactors = [3, 6, 9]

  let truncatedNum: number

  if (i18n.locale === AppLanguage.hi) {
    truncatedNum = truncateRounding(num, hiFactors)
  } else if (i18n.locale === AppLanguage.ko) {
    truncatedNum = truncateRounding(num, koFactors)
  } else if (
    [AppLanguage.es, AppLanguage.ca].includes(i18n.locale as AppLanguage)
  ) {
    truncatedNum = truncateRounding(num, esCaFactors)
  } else if (
    [AppLanguage.ja, AppLanguage.zh_CN, AppLanguage.zh_TW].includes(
      i18n.locale as AppLanguage,
    )
  ) {
    truncatedNum = truncateRounding(num, jaZhFactors)
  } else if (
    [AppLanguage.it, AppLanguage.de].includes(i18n.locale as AppLanguage)
  ) {
    truncatedNum = truncateRounding(num, itDeFactors)
  } else {
    truncatedNum = truncateRounding(num, normalFactors)
  }

  return i18n.number(truncatedNum, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
}

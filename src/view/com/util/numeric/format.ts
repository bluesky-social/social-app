import {I18n} from '@lingui/core'

const truncateRounding = (num: number, factors: Array<number>): number => {
  for (let i = factors.length - 1; i >= 0; i--) {
    const factor = factors[i]
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

const koFactors = [3, 4, 8]
const hiFactors = [3, 5, 7, 9]
const esCaFactors = [3, 6, 10]
const itDeFactors = [6, 9]
const jaZhFactors = [4, 8]
const normalFactors = [3, 6, 9]

export const formatCount = (i18n: I18n, num: number) => {
  const locale = i18n.locale
  let truncatedNum: number
  if (locale === 'hi') {
    truncatedNum = truncateRounding(num, hiFactors)
  } else if (locale === 'ko') {
    truncatedNum = truncateRounding(num, koFactors)
  } else if (locale === 'es' || locale === 'ca') {
    truncatedNum = truncateRounding(num, esCaFactors)
  } else if (locale === 'ja' || locale === 'zh-CN' || locale === 'zh-TW') {
    truncatedNum = truncateRounding(num, jaZhFactors)
  } else if (locale === 'it' || locale === 'de') {
    truncatedNum = truncateRounding(num, itDeFactors)
  } else {
    truncatedNum = truncateRounding(num, normalFactors)
  }
  return i18n.number(truncatedNum, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
}

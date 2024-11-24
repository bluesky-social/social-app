import {I18n} from '@lingui/core'

const truncateRounding = (num: number, factors: Array<number>): number => {
  for (let i = factors.length - 1; i >= 0; i--) {
    let factor = factors[i]
    if (num >= 10 ** factor) {
      if (factor === 10) {
        // CA and ES abruptly jump from "9999,9 M" to "10 mil M"
        factor--
      }
      const precision = 1
      const divisor = 10 ** (factor - precision)
      return Math.floor(num / divisor) * divisor
    }
  }
  return num
}

const koFactors = [3, 4, 8, 12]
const hiFactors = [3, 5, 7, 9, 11, 13]
const esCaFactors = [3, 6, 10, 12]
const itDeFactors = [6, 9, 12]
const jaZhFactors = [4, 8, 12]
const glFactors = [6, 12]
const restFactors = [3, 6, 9, 12]

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
  } else if (locale === 'gl') {
    truncatedNum = truncateRounding(num, glFactors)
  } else {
    truncatedNum = truncateRounding(num, restFactors)
  }
  return i18n.number(truncatedNum, {
    notation: 'compact',
    maximumFractionDigits: 1,
    // Ideally we'd use roundingMode: 'trunc' but it isn't supported on RN.
  })
}

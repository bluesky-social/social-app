import type {I18n} from '@lingui/core'

const SUPPORTS_ROUNDING_MODE = detectRoundingModeSupport()

export const formatCount = (i18n: I18n, num: number) => {
  const formattedNum = i18n.number(num, {
    notation: 'compact',
    maximumFractionDigits: 1,
    // @ts-ignore types are missing in CI
    roundingMode: 'trunc',
  })

  // some langagues like `jp` start truncating at different thresholds
  // so skip if no truncation happens
  if (SUPPORTS_ROUNDING_MODE || String(num) === formattedNum) {
    return formattedNum
  } else {
    // HACK: janky workaround for formatjs not supporting roundingMode
    // https://github.com/formatjs/formatjs/issues/4359
    // TODO: remove when fixed by formatjs -sfn
    //
    // error is when the number is within 50 of the threshold to the next rounded value
    // eg. 1050 is within 50 of 1100, so will incorrectly round to 1.1k. 1049 correctly goes to 1k
    const isNearThreshould = num > 1000 && num % 100 >= 50
    // applying `-((num % 100) - 49)` to the number will take it back down to beneath the threshold
    const correctedNum = isNearThreshould ? num - ((num % 100) - 49) : num
    return i18n.number(correctedNum, {
      notation: 'compact',
      maximumFractionDigits: 1,
      // @ts-ignore types are missing in CI
      roundingMode: 'trunc',
    })
  }
}

function detectRoundingModeSupport() {
  const testNum = 1050
  return (
    Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
      roundingMode: 'trunc',
    }).format(testNum) === '1k'
  )
}

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
    const factor =
      num < 1e3
        ? 1
        : num < 1e6
        ? 1e2 // 1e(6-4)
        : num < 1e9
        ? 1e5 // 1e(9-4)
        : num < 1e12
        ? 1e8 // 1e(12-4)
        : 1e11 // 1e(15-4)
    const truncatedNum = Math.trunc(num / factor) * factor
    return i18n.number(truncatedNum, {
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
      // @ts-ignore types are missing in CI
      roundingMode: 'trunc',
    }).format(testNum) === '1k'
  )
}

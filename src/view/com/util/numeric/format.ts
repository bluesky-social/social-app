import {useLanguagePrefs} from '#/state/preferences'
import {sanitizeAppLanguageSetting} from '#/locale/helpers'

export const FormatCount = (num: number) => {
  const {appLanguage} = useLanguagePrefs()
  return Intl.NumberFormat(sanitizeAppLanguageSetting(appLanguage), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num)
}

export function formatCountShortOnly(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return String(num)
}

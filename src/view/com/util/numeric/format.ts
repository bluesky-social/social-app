import * as persisted from '#/state/persisted'
import {sanitizeAppLanguageSetting} from '#/locale/helpers'

export const formatCount = (num: number) => {
  const appLanguage = persisted.get('languagePrefs').appLanguage
  const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage)
  return Intl.NumberFormat(sanitizedLanguage, {
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

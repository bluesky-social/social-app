import * as persisted from '#/state/persisted'
import {sanitizeAppLanguageSetting} from '#/locale/helpers'

export const formatCount = (num: number) => {
  return Intl.NumberFormat(
    sanitizeAppLanguageSetting(persisted.get('languagePrefs').appLanguage),
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(num)
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

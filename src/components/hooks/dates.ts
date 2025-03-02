/**
 * Hooks for date-fns localized formatters.
 *
 * Our app supports some languages that are not included in date-fns by
 * default, in which case it will fall back to English.
 *
 * {@link https://github.com/date-fns/date-fns/blob/main/docs/i18n.md}
 */

import React from 'react'
import {formatDistance, Locale} from 'date-fns'
import {
  ca,
  cy,
  da,
  de,
  el,
  enGB,
  es,
  eu,
  fi,
  fr,
  gl,
  hi,
  hu,
  id,
  it,
  ja,
  km,
  ko,
  nl,
  pl,
  ptBR,
  ro,
  ru,
  sv,
  th,
  tr,
  uk,
  vi,
  zhCN,
  zhHK,
  zhTW,
} from 'date-fns/locale'

import {AppLanguage} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * {@link AppLanguage}
 */
const locales: Record<AppLanguage, Locale | undefined> = {
  en: undefined,
  an: undefined,
  ast: undefined,
  ca,
  cy,
  da,
  de,
  el,
  ['en-GB']: enGB,
  es,
  eu,
  fi,
  fr,
  ga: undefined,
  gl,
  hi,
  hu,
  ia: undefined,
  id,
  it,
  ja,
  km,
  ko,
  ne: undefined,
  nl,
  pl,
  ['pt-BR']: ptBR,
  ro,
  ru,
  sv,
  th,
  tr,
  uk,
  vi,
  ['zh-Hans-CN']: zhCN,
  ['zh-Hant-HK']: zhHK,
  ['zh-Hant-TW']: zhTW,
}

/**
 * Returns a localized `formatDistance` function.
 * {@link formatDistance}
 */
export function useFormatDistance() {
  const {appLanguage} = useLanguagePrefs()
  return React.useCallback<typeof formatDistance>(
    (date, baseDate, options) => {
      const locale = locales[appLanguage as AppLanguage]
      return formatDistance(date, baseDate, {...options, locale: locale})
    },
    [appLanguage],
  )
}

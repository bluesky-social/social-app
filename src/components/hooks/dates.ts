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
  de,
  enGB,
  es,
  fi,
  fr,
  hi,
  hu,
  id,
  it,
  ja,
  ko,
  pl,
  ptBR,
  ru,
  th,
  tr,
  uk,
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
  ca,
  de,
  ['en-GB']: enGB,
  es,
  fi,
  fr,
  ga: undefined,
  hi,
  hu,
  id,
  it,
  ja,
  ko,
  pl,
  ['pt-BR']: ptBR,
  ru,
  th,
  tr,
  uk,
  ['zh-CN']: zhCN,
  ['zh-HK']: zhHK,
  ['zh-TW']: zhTW,
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

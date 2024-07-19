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
  es,
  fi,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  ptBR,
  tr,
  uk,
  zhCN,
  zhTW,
} from 'date-fns/locale'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {AppLanguage} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * {@link AppLanguage}
 */
const locales: Record<string, Locale> = {
  ca,
  de,
  es,
  fi,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  ptBR,
  tr,
  uk,
  zhCN,
  zhTW,
}

/**
 * Returns a localized `formatDistance` function.
 * {@link formatDistance}
 */
export function useFormatDistance() {
  const {appLanguage} = useLanguagePrefs()
  return React.useCallback<typeof formatDistance>(
    (date, baseDate, options) => {
      const locale = locales[appLanguage]
      return formatDistance(date, baseDate, {...options, locale: locale})
    },
    [appLanguage],
  )
}

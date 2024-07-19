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

import {useLanguagePrefs} from '#/state/preferences'

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

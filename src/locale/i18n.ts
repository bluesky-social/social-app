import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {useLanguagePrefs} from '#/state/preferences'
import {messages as messagesEn} from '#/locale/locales/en/messages'
import {messages as messagesHi} from '#/locale/locales/hi/messages'

export const locales = {
  en: 'English',
  cs: 'Česky',
  fr: 'Français',
  hi: 'हिंदी',
  es: 'Español',
}
export const defaultLocale = 'en'

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: string) {
  if (locale === 'hi') {
    i18n.loadAndActivate({locale, messages: messagesHi})
  } else {
    i18n.loadAndActivate({locale, messages: messagesEn})
  }
}

export async function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  useEffect(() => {
    dynamicActivate(appLanguage)
  }, [appLanguage])
}

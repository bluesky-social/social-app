import {useLanguagePrefs} from '#/state/preferences'
import {i18n} from '@lingui/core'
import {useEffect} from 'react'
import {messages as messagesEn} from './locales/en/messages'
import {messages as messagesHi} from './locales/hi/messages'

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
  console.log('dynamicActivate', locale)
  if (locale === 'en') {
    i18n.loadAndActivate({locale, messages: messagesEn})
    return
  } else if (locale === 'hi') {
    i18n.loadAndActivate({locale, messages: messagesHi})
    return
  } else {
    i18n.loadAndActivate({locale, messages: messagesEn})
    return
  }
}

export async function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  useEffect(() => {
    dynamicActivate(appLanguage)
  }, [appLanguage])
}

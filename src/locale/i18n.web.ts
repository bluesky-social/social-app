import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {useLanguagePrefs} from '#/state/preferences'

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
  let mod: any

  if (locale === 'hi') {
    mod = await import(`./locales/hi/messages`)
  } else {
    mod = await import(`./locales/en/messages`)
  }

  i18n.load(locale, mod.messages)
  i18n.activate(locale)
}

export async function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  useEffect(() => {
    dynamicActivate(appLanguage)
  }, [appLanguage])
}

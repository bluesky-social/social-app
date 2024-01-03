import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {useLanguagePrefs} from '#/state/preferences'
import {messages as messagesEn} from '#/locale/locales/en/messages'
// DISABLED until this translation is fixed -prf
// import {messages as messagesDe} from '#/locale/locales/de/messages'
// DISABLED until this translation is more thoroughly reviewed -prf
// import {messages as messagesEs} from '#/locale/locales/es/messages'
import {messages as messagesFr} from '#/locale/locales/fr/messages'
import {messages as messagesHi} from '#/locale/locales/hi/messages'
import {messages as messagesJa} from '#/locale/locales/ja/messages'
import {messages as messagesKo} from '#/locale/locales/ko/messages'
import {messages as messagesPt} from '#/locale/locales/pt/messages'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  switch (locale) {
    // DISABLED until this translation is fixed -prf
    // case AppLanguage.de: {
    //   i18n.loadAndActivate({locale, messages: messagesDe})
    //   break
    // }
    // DISABLED until this translation is more thoroughly reviewed -prf
    // case AppLanguage.es: {
    //   i18n.loadAndActivate({locale, messages: messagesEs})
    //   break
    // }
    case AppLanguage.fr: {
      i18n.loadAndActivate({locale, messages: messagesFr})
      break
    }
    case AppLanguage.hi: {
      i18n.loadAndActivate({locale, messages: messagesHi})
      break
    }
    case AppLanguage.ja: {
      i18n.loadAndActivate({locale, messages: messagesJa})
      break
    }
    case AppLanguage.ko: {
      i18n.loadAndActivate({locale, messages: messagesKo})
      break
    }
    default: {
      i18n.loadAndActivate({locale, messages: messagesEn})
      break
    }
    case AppLanguage.pt: {
      i18n.loadAndActivate({locale, messages: messagesPt})
      break
    }    
  }
}

export async function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  useEffect(() => {
    dynamicActivate(sanitizeAppLanguageSetting(appLanguage))
  }, [appLanguage])
}

import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {useLanguagePrefs} from '#/state/preferences'
import {messages as messagesEn} from '#/locale/locales/en/messages'
import {messages as messagesDe} from '#/locale/locales/de/messages'
import {messages as messagesId} from '#/locale/locales/id/messages'
import {messages as messagesEs} from '#/locale/locales/es/messages'
import {messages as messagesFr} from '#/locale/locales/fr/messages'
import {messages as messagesHi} from '#/locale/locales/hi/messages'
import {messages as messagesJa} from '#/locale/locales/ja/messages'
import {messages as messagesKo} from '#/locale/locales/ko/messages'
import {messages as messagesPt_BR} from '#/locale/locales/pt-BR/messages'
import {messages as messagesUk} from '#/locale/locales/uk/messages'
import {messages as messagesCa} from '#/locale/locales/ca/messages'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  switch (locale) {
    case AppLanguage.de: {
      i18n.loadAndActivate({locale, messages: messagesDe})
      break
    }
    case AppLanguage.es: {
      i18n.loadAndActivate({locale, messages: messagesEs})
      break
    }
    case AppLanguage.fr: {
      i18n.loadAndActivate({locale, messages: messagesFr})
      break
    }
    case AppLanguage.hi: {
      i18n.loadAndActivate({locale, messages: messagesHi})
      break
    }
    case AppLanguage.id: {
      i18n.loadAndActivate({locale, messages: messagesId})
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
    case AppLanguage.pt_BR: {
      i18n.loadAndActivate({locale, messages: messagesPt_BR})
      break
    }
    case AppLanguage.uk: {
      i18n.loadAndActivate({locale, messages: messagesUk})
      break
    }
    case AppLanguage.ca: {
      i18n.loadAndActivate({locale, messages: messagesCa})
      break
    }
    default: {
      i18n.loadAndActivate({locale, messages: messagesEn})
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

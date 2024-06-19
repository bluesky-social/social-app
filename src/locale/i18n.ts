// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'
import '@formatjs/intl-numberformat/polyfill-force'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-numberformat/locale-data/en'

import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {messages as messagesCa} from '#/locale/locales/ca/messages'
import {messages as messagesDe} from '#/locale/locales/de/messages'
import {messages as messagesEn} from '#/locale/locales/en/messages'
import {messages as messagesEs} from '#/locale/locales/es/messages'
import {messages as messagesFi} from '#/locale/locales/fi/messages'
import {messages as messagesFr} from '#/locale/locales/fr/messages'
import {messages as messagesGa} from '#/locale/locales/ga/messages'
import {messages as messagesHi} from '#/locale/locales/hi/messages'
import {messages as messagesId} from '#/locale/locales/id/messages'
import {messages as messagesIt} from '#/locale/locales/it/messages'
import {messages as messagesJa} from '#/locale/locales/ja/messages'
import {messages as messagesKo} from '#/locale/locales/ko/messages'
import {messages as messagesPt_BR} from '#/locale/locales/pt-BR/messages'
import {messages as messagesTr} from '#/locale/locales/tr/messages'
import {messages as messagesUk} from '#/locale/locales/uk/messages'
import {messages as messagesZh_CN} from '#/locale/locales/zh-CN/messages'
import {messages as messagesZh_TW} from '#/locale/locales/zh-TW/messages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  switch (locale) {
    case AppLanguage.ca: {
      i18n.loadAndActivate({locale, messages: messagesCa})
      await import('@formatjs/intl-pluralrules/locale-data/ca')
      break
    }
    case AppLanguage.de: {
      i18n.loadAndActivate({locale, messages: messagesDe})
      await import('@formatjs/intl-pluralrules/locale-data/de')
      break
    }
    case AppLanguage.es: {
      i18n.loadAndActivate({locale, messages: messagesEs})
      await import('@formatjs/intl-pluralrules/locale-data/es')
      break
    }
    case AppLanguage.fi: {
      i18n.loadAndActivate({locale, messages: messagesFi})
      await import('@formatjs/intl-pluralrules/locale-data/fi')
      break
    }
    case AppLanguage.fr: {
      i18n.loadAndActivate({locale, messages: messagesFr})
      await import('@formatjs/intl-pluralrules/locale-data/fr')
      break
    }
    case AppLanguage.ga: {
      i18n.loadAndActivate({locale, messages: messagesGa})
      await import('@formatjs/intl-pluralrules/locale-data/ga')
      break
    }
    case AppLanguage.hi: {
      i18n.loadAndActivate({locale, messages: messagesHi})
      await import('@formatjs/intl-pluralrules/locale-data/hi')
      break
    }
    case AppLanguage.id: {
      i18n.loadAndActivate({locale, messages: messagesId})
      await import('@formatjs/intl-pluralrules/locale-data/id')
      break
    }
    case AppLanguage.it: {
      i18n.loadAndActivate({locale, messages: messagesIt})
      await import('@formatjs/intl-pluralrules/locale-data/it')
      break
    }
    case AppLanguage.ja: {
      i18n.loadAndActivate({locale, messages: messagesJa})
      await import('@formatjs/intl-pluralrules/locale-data/ja')
      break
    }
    case AppLanguage.ko: {
      i18n.loadAndActivate({locale, messages: messagesKo})
      await import('@formatjs/intl-pluralrules/locale-data/ko')
      break
    }
    case AppLanguage.pt_BR: {
      i18n.loadAndActivate({locale, messages: messagesPt_BR})
      await import('@formatjs/intl-pluralrules/locale-data/pt')
      break
    }
    case AppLanguage.tr: {
      i18n.loadAndActivate({locale, messages: messagesTr})
      await import('@formatjs/intl-pluralrules/locale-data/tr')
      break
    }
    case AppLanguage.uk: {
      i18n.loadAndActivate({locale, messages: messagesUk})
      await import('@formatjs/intl-pluralrules/locale-data/uk')
      break
    }
    case AppLanguage.zh_CN: {
      i18n.loadAndActivate({locale, messages: messagesZh_CN})
      await import('@formatjs/intl-pluralrules/locale-data/zh')
      break
    }
    case AppLanguage.zh_TW: {
      i18n.loadAndActivate({locale, messages: messagesZh_TW})
      await import('@formatjs/intl-pluralrules/locale-data/zh')
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

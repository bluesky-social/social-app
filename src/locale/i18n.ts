// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-datetimeformat/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'
import '@formatjs/intl-numberformat/polyfill-force'
import '@formatjs/intl-datetimeformat/locale-data/en'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-numberformat/locale-data/en'

import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {messages as messagesAn} from '#/locale/locales/an/messages'
import {messages as messagesAst} from '#/locale/locales/ast/messages'
import {messages as messagesCa} from '#/locale/locales/ca/messages'
import {messages as messagesDe} from '#/locale/locales/de/messages'
import {messages as messagesEn} from '#/locale/locales/en/messages'
import {messages as messagesEn_GB} from '#/locale/locales/en-GB/messages'
import {messages as messagesEs} from '#/locale/locales/es/messages'
import {messages as messagesFi} from '#/locale/locales/fi/messages'
import {messages as messagesFr} from '#/locale/locales/fr/messages'
import {messages as messagesGa} from '#/locale/locales/ga/messages'
import {messages as messagesGl} from '#/locale/locales/gl/messages'
import {messages as messagesHi} from '#/locale/locales/hi/messages'
import {messages as messagesHu} from '#/locale/locales/hu/messages'
import {messages as messagesId} from '#/locale/locales/id/messages'
import {messages as messagesIt} from '#/locale/locales/it/messages'
import {messages as messagesJa} from '#/locale/locales/ja/messages'
import {messages as messagesKo} from '#/locale/locales/ko/messages'
import {messages as messagesNl} from '#/locale/locales/nl/messages'
import {messages as messagesPl} from '#/locale/locales/pl/messages'
import {messages as messagesPt_BR} from '#/locale/locales/pt-BR/messages'
import {messages as messagesRu} from '#/locale/locales/ru/messages'
import {messages as messagesTh} from '#/locale/locales/th/messages'
import {messages as messagesTr} from '#/locale/locales/tr/messages'
import {messages as messagesUk} from '#/locale/locales/uk/messages'
import {messages as messagesVi} from '#/locale/locales/vi/messages'
import {messages as messagesZh_CN} from '#/locale/locales/zh-CN/messages'
import {messages as messagesZh_HK} from '#/locale/locales/zh-HK/messages'
import {messages as messagesZh_TW} from '#/locale/locales/zh-TW/messages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  switch (locale) {
    case AppLanguage.an: {
      i18n.loadAndActivate({locale, messages: messagesAn})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/es'),
        import('@formatjs/intl-pluralrules/locale-data/an'),
        import('@formatjs/intl-numberformat/locale-data/es'),
      ])
      break
    }
    case AppLanguage.ast: {
      i18n.loadAndActivate({locale, messages: messagesAst})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/ast'),
        import('@formatjs/intl-pluralrules/locale-data/ast'),
        import('@formatjs/intl-numberformat/locale-data/ast'),
      ])
      break
    }
    case AppLanguage.ca: {
      i18n.loadAndActivate({locale, messages: messagesCa})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/ca'),
        import('@formatjs/intl-pluralrules/locale-data/ca'),
        import('@formatjs/intl-numberformat/locale-data/ca'),
      ])
      break
    }
    case AppLanguage.de: {
      i18n.loadAndActivate({locale, messages: messagesDe})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/de'),
        import('@formatjs/intl-pluralrules/locale-data/de'),
        import('@formatjs/intl-numberformat/locale-data/de'),
      ])
      break
    }
    case AppLanguage.en_GB: {
      i18n.loadAndActivate({locale, messages: messagesEn_GB})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/en-GB'),
        import('@formatjs/intl-pluralrules/locale-data/en'),
        import('@formatjs/intl-numberformat/locale-data/en-GB'),
      ])
      break
    }
    case AppLanguage.es: {
      i18n.loadAndActivate({locale, messages: messagesEs})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/es'),
        import('@formatjs/intl-pluralrules/locale-data/es'),
        import('@formatjs/intl-numberformat/locale-data/es'),
      ])
      break
    }
    case AppLanguage.fi: {
      i18n.loadAndActivate({locale, messages: messagesFi})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/fi'),
        import('@formatjs/intl-pluralrules/locale-data/fi'),
        import('@formatjs/intl-numberformat/locale-data/fi'),
      ])
      break
    }
    case AppLanguage.fr: {
      i18n.loadAndActivate({locale, messages: messagesFr})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/fr'),
        import('@formatjs/intl-pluralrules/locale-data/fr'),
        import('@formatjs/intl-numberformat/locale-data/fr'),
      ])
      break
    }
    case AppLanguage.ga: {
      i18n.loadAndActivate({locale, messages: messagesGa})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/ga'),
        import('@formatjs/intl-pluralrules/locale-data/ga'),
        import('@formatjs/intl-numberformat/locale-data/ga'),
      ])
      break
    }
    case AppLanguage.gl: {
      i18n.loadAndActivate({locale, messages: messagesGl})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/gl'),
        import('@formatjs/intl-pluralrules/locale-data/gl'),
        import('@formatjs/intl-numberformat/locale-data/gl'),
      ])
      break
    }
    case AppLanguage.hi: {
      i18n.loadAndActivate({locale, messages: messagesHi})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/hi'),
        import('@formatjs/intl-pluralrules/locale-data/hi'),
        import('@formatjs/intl-numberformat/locale-data/hi'),
      ])
      break
    }
    case AppLanguage.hu: {
      i18n.loadAndActivate({locale, messages: messagesHu})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/hu'),
        import('@formatjs/intl-pluralrules/locale-data/hu'),
        import('@formatjs/intl-numberformat/locale-data/hu'),
      ])
      break
    }
    case AppLanguage.id: {
      i18n.loadAndActivate({locale, messages: messagesId})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/id'),
        import('@formatjs/intl-pluralrules/locale-data/id'),
        import('@formatjs/intl-numberformat/locale-data/id'),
      ])
      break
    }
    case AppLanguage.it: {
      i18n.loadAndActivate({locale, messages: messagesIt})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/it'),
        import('@formatjs/intl-pluralrules/locale-data/it'),
        import('@formatjs/intl-numberformat/locale-data/it'),
      ])
      break
    }
    case AppLanguage.ja: {
      i18n.loadAndActivate({locale, messages: messagesJa})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/ja'),
        import('@formatjs/intl-pluralrules/locale-data/ja'),
        import('@formatjs/intl-numberformat/locale-data/ja'),
      ])
      break
    }
    case AppLanguage.ko: {
      i18n.loadAndActivate({locale, messages: messagesKo})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/ko'),
        import('@formatjs/intl-pluralrules/locale-data/ko'),
        import('@formatjs/intl-numberformat/locale-data/ko'),
      ])
      break
    }
    case AppLanguage.nl: {
      i18n.loadAndActivate({locale, messages: messagesNl})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/nl'),
        import('@formatjs/intl-pluralrules/locale-data/nl'),
        import('@formatjs/intl-numberformat/locale-data/nl'),
      ])
      break
    }
    case AppLanguage.pl: {
      i18n.loadAndActivate({locale, messages: messagesPl})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/pl'),
        import('@formatjs/intl-pluralrules/locale-data/pl'),
        import('@formatjs/intl-numberformat/locale-data/pl'),
      ])
      break
    }
    case AppLanguage.pt_BR: {
      i18n.loadAndActivate({locale, messages: messagesPt_BR})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/pt'),
        import('@formatjs/intl-pluralrules/locale-data/pt'),
        import('@formatjs/intl-numberformat/locale-data/pt'),
      ])
      break
    }
    case AppLanguage.ru: {
      i18n.loadAndActivate({locale, messages: messagesRu})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/ru'),
        import('@formatjs/intl-pluralrules/locale-data/ru'),
        import('@formatjs/intl-numberformat/locale-data/ru'),
      ])
      break
    }
    case AppLanguage.th: {
      i18n.loadAndActivate({locale, messages: messagesTh})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/th'),
        import('@formatjs/intl-pluralrules/locale-data/th'),
        import('@formatjs/intl-numberformat/locale-data/th'),
      ])
      break
    }
    case AppLanguage.tr: {
      i18n.loadAndActivate({locale, messages: messagesTr})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/tr'),
        import('@formatjs/intl-pluralrules/locale-data/tr'),
        import('@formatjs/intl-numberformat/locale-data/tr'),
      ])
      break
    }
    case AppLanguage.uk: {
      i18n.loadAndActivate({locale, messages: messagesUk})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/uk'),
        import('@formatjs/intl-pluralrules/locale-data/uk'),
        import('@formatjs/intl-numberformat/locale-data/uk'),
      ])
      break
    }
    case AppLanguage.vi: {
      i18n.loadAndActivate({locale, messages: messagesVi})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/vi'),
        import('@formatjs/intl-pluralrules/locale-data/vi'),
        import('@formatjs/intl-numberformat/locale-data/vi'),
      ])
      break
    }
    case AppLanguage.zh_CN: {
      i18n.loadAndActivate({locale, messages: messagesZh_CN})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/zh-Hans'),
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
      ])
      break
    }
    case AppLanguage.zh_HK: {
      i18n.loadAndActivate({locale, messages: messagesZh_HK})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/yue'),
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
      ])
      break
    }
    case AppLanguage.zh_TW: {
      i18n.loadAndActivate({locale, messages: messagesZh_TW})
      await Promise.all([
        import('@formatjs/intl-datetimeformat/locale-data/zh-Hant'),
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
      ])
      break
    }
    default: {
      i18n.loadAndActivate({locale, messages: messagesEn})
      break
    }
  }
}

export function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  useEffect(() => {
    dynamicActivate(sanitizeAppLanguageSetting(appLanguage))
  }, [appLanguage])
}

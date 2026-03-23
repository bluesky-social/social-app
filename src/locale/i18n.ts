// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'
import '@formatjs/intl-numberformat/polyfill-force'
import '@formatjs/intl-displaynames/polyfill-force'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-displaynames/locale-data/en'

import {useEffect, useState} from 'react'
import {i18n} from '@lingui/core'
import defaultLocale from 'date-fns/locale/en-US'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {messages as messagesAn} from '#/locale/locales/an/messages'
import {messages as messagesAst} from '#/locale/locales/ast/messages'
import {messages as messagesCa} from '#/locale/locales/ca/messages'
import {messages as messagesCy} from '#/locale/locales/cy/messages'
import {messages as messagesDa} from '#/locale/locales/da/messages'
import {messages as messagesDe} from '#/locale/locales/de/messages'
import {messages as messagesEl} from '#/locale/locales/el/messages'
import {messages as messagesEn} from '#/locale/locales/en/messages'
import {messages as messagesEn_GB} from '#/locale/locales/en-GB/messages'
import {messages as messagesEo} from '#/locale/locales/eo/messages'
import {messages as messagesEs} from '#/locale/locales/es/messages'
import {messages as messagesEu} from '#/locale/locales/eu/messages'
import {messages as messagesFi} from '#/locale/locales/fi/messages'
import {messages as messagesFr} from '#/locale/locales/fr/messages'
import {messages as messagesFy} from '#/locale/locales/fy/messages'
import {messages as messagesGa} from '#/locale/locales/ga/messages'
import {messages as messagesGd} from '#/locale/locales/gd/messages'
import {messages as messagesGl} from '#/locale/locales/gl/messages'
import {messages as messagesHi} from '#/locale/locales/hi/messages'
import {messages as messagesHu} from '#/locale/locales/hu/messages'
import {messages as messagesIa} from '#/locale/locales/ia/messages'
import {messages as messagesId} from '#/locale/locales/id/messages'
import {messages as messagesIt} from '#/locale/locales/it/messages'
import {messages as messagesJa} from '#/locale/locales/ja/messages'
import {messages as messagesKm} from '#/locale/locales/km/messages'
import {messages as messagesKo} from '#/locale/locales/ko/messages'
import {messages as messagesNe} from '#/locale/locales/ne/messages'
import {messages as messagesNl} from '#/locale/locales/nl/messages'
import {messages as messagesPl} from '#/locale/locales/pl/messages'
import {messages as messagesPt_BR} from '#/locale/locales/pt-BR/messages'
import {messages as messagesPt_PT} from '#/locale/locales/pt-PT/messages'
import {messages as messagesRo} from '#/locale/locales/ro/messages'
import {messages as messagesRu} from '#/locale/locales/ru/messages'
import {messages as messagesSv} from '#/locale/locales/sv/messages'
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
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/es'),
        import('@formatjs/intl-pluralrules/locale-data/an'),
        import('@formatjs/intl-numberformat/locale-data/es'),
        import('@formatjs/intl-displaynames/locale-data/es'),
      ])
      return dateLocale
    }
    case AppLanguage.ast: {
      i18n.loadAndActivate({locale, messages: messagesAst})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/es'),
        import('@formatjs/intl-pluralrules/locale-data/ast'),
        import('@formatjs/intl-numberformat/locale-data/ast'),
        import('@formatjs/intl-displaynames/locale-data/ast'),
      ])
      return dateLocale
    }
    case AppLanguage.ca: {
      i18n.loadAndActivate({locale, messages: messagesCa})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/ca'),
        import('@formatjs/intl-pluralrules/locale-data/ca'),
        import('@formatjs/intl-numberformat/locale-data/ca'),
        import('@formatjs/intl-displaynames/locale-data/ca'),
      ])
      return dateLocale
    }
    case AppLanguage.cy: {
      i18n.loadAndActivate({locale, messages: messagesCy})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/cy'),
        import('@formatjs/intl-pluralrules/locale-data/cy'),
        import('@formatjs/intl-numberformat/locale-data/cy'),
        import('@formatjs/intl-displaynames/locale-data/cy'),
      ])
      return dateLocale
    }
    case AppLanguage.da: {
      i18n.loadAndActivate({locale, messages: messagesDa})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/da'),
        import('@formatjs/intl-pluralrules/locale-data/da'),
        import('@formatjs/intl-numberformat/locale-data/da'),
        import('@formatjs/intl-displaynames/locale-data/da'),
      ])
      return dateLocale
    }
    case AppLanguage.de: {
      i18n.loadAndActivate({locale, messages: messagesDe})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/de'),
        import('@formatjs/intl-pluralrules/locale-data/de'),
        import('@formatjs/intl-numberformat/locale-data/de'),
        import('@formatjs/intl-displaynames/locale-data/de'),
      ])
      return dateLocale
    }
    case AppLanguage.el: {
      i18n.loadAndActivate({locale, messages: messagesEl})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/el'),
        import('@formatjs/intl-pluralrules/locale-data/el'),
        import('@formatjs/intl-numberformat/locale-data/el'),
        import('@formatjs/intl-displaynames/locale-data/el'),
      ])
      return dateLocale
    }
    case AppLanguage.en_GB: {
      i18n.loadAndActivate({locale, messages: messagesEn_GB})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/en-GB'),
        import('@formatjs/intl-pluralrules/locale-data/en'),
        import('@formatjs/intl-numberformat/locale-data/en-GB'),
        import('@formatjs/intl-displaynames/locale-data/en-GB'),
      ])
      return dateLocale
    }
    case AppLanguage.eo: {
      i18n.loadAndActivate({locale, messages: messagesEo})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/eo'),
        import('@formatjs/intl-pluralrules/locale-data/eo'),
        import('@formatjs/intl-numberformat/locale-data/eo'),
        // borked, see https://github.com/bluesky-social/social-app/pull/9574
        // import('@formatjs/intl-displaynames/locale-data/eo'),
      ])
      return dateLocale
    }
    case AppLanguage.es: {
      i18n.loadAndActivate({locale, messages: messagesEs})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/es'),
        import('@formatjs/intl-pluralrules/locale-data/es'),
        import('@formatjs/intl-numberformat/locale-data/es'),
        import('@formatjs/intl-displaynames/locale-data/es'),
      ])
      return dateLocale
    }
    case AppLanguage.eu: {
      i18n.loadAndActivate({locale, messages: messagesEu})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/eu'),
        import('@formatjs/intl-pluralrules/locale-data/eu'),
        import('@formatjs/intl-numberformat/locale-data/eu'),
        import('@formatjs/intl-displaynames/locale-data/eu'),
      ])
      return dateLocale
    }
    case AppLanguage.fi: {
      i18n.loadAndActivate({locale, messages: messagesFi})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/fi'),
        import('@formatjs/intl-pluralrules/locale-data/fi'),
        import('@formatjs/intl-numberformat/locale-data/fi'),
        import('@formatjs/intl-displaynames/locale-data/fi'),
      ])
      return dateLocale
    }
    case AppLanguage.fr: {
      i18n.loadAndActivate({locale, messages: messagesFr})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/fr'),
        import('@formatjs/intl-pluralrules/locale-data/fr'),
        import('@formatjs/intl-numberformat/locale-data/fr'),
        import('@formatjs/intl-displaynames/locale-data/fr'),
      ])
      return dateLocale
    }
    case AppLanguage.fy: {
      i18n.loadAndActivate({locale, messages: messagesFy})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/fy'),
        import('@formatjs/intl-pluralrules/locale-data/fy'),
        import('@formatjs/intl-numberformat/locale-data/fy'),
        import('@formatjs/intl-displaynames/locale-data/fy'),
      ])
      return dateLocale
    }
    case AppLanguage.ga: {
      i18n.loadAndActivate({locale, messages: messagesGa})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ga'),
        import('@formatjs/intl-numberformat/locale-data/ga'),
        import('@formatjs/intl-displaynames/locale-data/ga'),
      ])
      return undefined
    }
    case AppLanguage.gd: {
      i18n.loadAndActivate({locale, messages: messagesGd})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/gd'),
        import('@formatjs/intl-pluralrules/locale-data/gd'),
        import('@formatjs/intl-numberformat/locale-data/gd'),
        import('@formatjs/intl-displaynames/locale-data/gd'),
      ])
      return dateLocale
    }
    case AppLanguage.gl: {
      i18n.loadAndActivate({locale, messages: messagesGl})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/gl'),
        import('@formatjs/intl-pluralrules/locale-data/gl'),
        import('@formatjs/intl-numberformat/locale-data/gl'),
        import('@formatjs/intl-displaynames/locale-data/gl'),
      ])
      return dateLocale
    }
    case AppLanguage.hi: {
      i18n.loadAndActivate({locale, messages: messagesHi})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/hi'),
        import('@formatjs/intl-pluralrules/locale-data/hi'),
        import('@formatjs/intl-numberformat/locale-data/hi'),
        import('@formatjs/intl-displaynames/locale-data/hi'),
      ])
      return dateLocale
    }
    case AppLanguage.hu: {
      i18n.loadAndActivate({locale, messages: messagesHu})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/hu'),
        import('@formatjs/intl-pluralrules/locale-data/hu'),
        import('@formatjs/intl-numberformat/locale-data/hu'),
        import('@formatjs/intl-displaynames/locale-data/hu'),
      ])
      return dateLocale
    }
    case AppLanguage.ia: {
      i18n.loadAndActivate({locale, messages: messagesIa})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ia'),
        import('@formatjs/intl-numberformat/locale-data/ia'),
        import('@formatjs/intl-displaynames/locale-data/ia'),
      ])
      return undefined
    }
    case AppLanguage.id: {
      i18n.loadAndActivate({locale, messages: messagesId})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/id'),
        import('@formatjs/intl-pluralrules/locale-data/id'),
        import('@formatjs/intl-numberformat/locale-data/id'),
        import('@formatjs/intl-displaynames/locale-data/id'),
      ])
      return dateLocale
    }
    case AppLanguage.it: {
      i18n.loadAndActivate({locale, messages: messagesIt})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/it'),
        import('@formatjs/intl-pluralrules/locale-data/it'),
        import('@formatjs/intl-numberformat/locale-data/it'),
        import('@formatjs/intl-displaynames/locale-data/it'),
      ])
      return dateLocale
    }
    case AppLanguage.ja: {
      i18n.loadAndActivate({locale, messages: messagesJa})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/ja'),
        import('@formatjs/intl-pluralrules/locale-data/ja'),
        import('@formatjs/intl-numberformat/locale-data/ja'),
        import('@formatjs/intl-displaynames/locale-data/ja'),
      ])
      return dateLocale
    }
    case AppLanguage.km: {
      i18n.loadAndActivate({locale, messages: messagesKm})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/km'),
        import('@formatjs/intl-pluralrules/locale-data/km'),
        import('@formatjs/intl-numberformat/locale-data/km'),
        import('@formatjs/intl-displaynames/locale-data/km'),
      ])
      return dateLocale
    }
    case AppLanguage.ko: {
      i18n.loadAndActivate({locale, messages: messagesKo})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/ko'),
        import('@formatjs/intl-pluralrules/locale-data/ko'),
        import('@formatjs/intl-numberformat/locale-data/ko'),
        import('@formatjs/intl-displaynames/locale-data/ko'),
      ])
      return dateLocale
    }
    case AppLanguage.ne: {
      i18n.loadAndActivate({locale, messages: messagesNe})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ne'),
        import('@formatjs/intl-numberformat/locale-data/ne'),
        import('@formatjs/intl-displaynames/locale-data/ne'),
      ])
      return undefined
    }
    case AppLanguage.nl: {
      i18n.loadAndActivate({locale, messages: messagesNl})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/nl'),
        import('@formatjs/intl-pluralrules/locale-data/nl'),
        import('@formatjs/intl-numberformat/locale-data/nl'),
        import('@formatjs/intl-displaynames/locale-data/nl'),
      ])
      return dateLocale
    }
    case AppLanguage.pl: {
      i18n.loadAndActivate({locale, messages: messagesPl})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/pl'),
        import('@formatjs/intl-pluralrules/locale-data/pl'),
        import('@formatjs/intl-numberformat/locale-data/pl'),
        import('@formatjs/intl-displaynames/locale-data/pl'),
      ])
      return dateLocale
    }
    case AppLanguage.pt_BR: {
      i18n.loadAndActivate({locale, messages: messagesPt_BR})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/pt-BR'),
        import('@formatjs/intl-pluralrules/locale-data/pt'),
        import('@formatjs/intl-numberformat/locale-data/pt'),
        import('@formatjs/intl-displaynames/locale-data/pt'),
      ])
      return dateLocale
    }
    case AppLanguage.pt_PT: {
      i18n.loadAndActivate({locale, messages: messagesPt_PT})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/pt'),
        import('@formatjs/intl-pluralrules/locale-data/pt-PT'),
        import('@formatjs/intl-numberformat/locale-data/pt-PT'),
        import('@formatjs/intl-displaynames/locale-data/pt-PT'),
      ])
      return dateLocale
    }
    case AppLanguage.ro: {
      i18n.loadAndActivate({locale, messages: messagesRo})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/ro'),
        import('@formatjs/intl-pluralrules/locale-data/ro'),
        import('@formatjs/intl-numberformat/locale-data/ro'),
        import('@formatjs/intl-displaynames/locale-data/ro'),
      ])
      return dateLocale
    }
    case AppLanguage.ru: {
      i18n.loadAndActivate({locale, messages: messagesRu})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/ru'),
        import('@formatjs/intl-pluralrules/locale-data/ru'),
        import('@formatjs/intl-numberformat/locale-data/ru'),
        import('@formatjs/intl-displaynames/locale-data/ru'),
      ])
      return dateLocale
    }
    case AppLanguage.sv: {
      i18n.loadAndActivate({locale, messages: messagesSv})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/sv'),
        import('@formatjs/intl-pluralrules/locale-data/sv'),
        import('@formatjs/intl-numberformat/locale-data/sv'),
        import('@formatjs/intl-displaynames/locale-data/sv'),
      ])
      return dateLocale
    }
    case AppLanguage.th: {
      i18n.loadAndActivate({locale, messages: messagesTh})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/th'),
        import('@formatjs/intl-pluralrules/locale-data/th'),
        import('@formatjs/intl-numberformat/locale-data/th'),
        import('@formatjs/intl-displaynames/locale-data/th'),
      ])
      return dateLocale
    }
    case AppLanguage.tr: {
      i18n.loadAndActivate({locale, messages: messagesTr})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/tr'),
        import('@formatjs/intl-pluralrules/locale-data/tr'),
        import('@formatjs/intl-numberformat/locale-data/tr'),
        import('@formatjs/intl-displaynames/locale-data/tr'),
      ])
      return dateLocale
    }
    case AppLanguage.uk: {
      i18n.loadAndActivate({locale, messages: messagesUk})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/uk'),
        import('@formatjs/intl-pluralrules/locale-data/uk'),
        import('@formatjs/intl-numberformat/locale-data/uk'),
        import('@formatjs/intl-displaynames/locale-data/uk'),
      ])
      return dateLocale
    }
    case AppLanguage.vi: {
      i18n.loadAndActivate({locale, messages: messagesVi})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/vi'),
        import('@formatjs/intl-pluralrules/locale-data/vi'),
        import('@formatjs/intl-numberformat/locale-data/vi'),
        import('@formatjs/intl-displaynames/locale-data/vi'),
      ])
      return dateLocale
    }
    case AppLanguage.zh_CN: {
      i18n.loadAndActivate({locale, messages: messagesZh_CN})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/zh-CN'),
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
        import('@formatjs/intl-displaynames/locale-data/zh'),
      ])
      return dateLocale
    }
    case AppLanguage.zh_HK: {
      i18n.loadAndActivate({locale, messages: messagesZh_HK})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/zh-HK'),
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
        import('@formatjs/intl-displaynames/locale-data/zh'),
      ])
      return dateLocale
    }
    case AppLanguage.zh_TW: {
      i18n.loadAndActivate({locale, messages: messagesZh_TW})
      const [{default: dateLocale}] = await Promise.all([
        import('date-fns/locale/zh-TW'),
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
        import('@formatjs/intl-displaynames/locale-data/zh'),
      ])
      return dateLocale
    }
    default: {
      i18n.loadAndActivate({locale, messages: messagesEn})
      return defaultLocale
    }
  }
}

export function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  const [dateLocale, setDateLocale] = useState(defaultLocale)

  useEffect(() => {
    dynamicActivate(sanitizeAppLanguageSetting(appLanguage)).then(locale => {
      setDateLocale(locale ?? defaultLocale)
    })
  }, [appLanguage])

  return dateLocale
}

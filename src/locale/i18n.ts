// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
import '@formatjs/intl-locale/polyfill-force.js'
import '@formatjs/intl-pluralrules/polyfill-force.js'
import '@formatjs/intl-numberformat/polyfill-force.js'
import '@formatjs/intl-displaynames/polyfill-force.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import '@formatjs/intl-numberformat/locale-data/en.js'
import '@formatjs/intl-displaynames/locale-data/en.js'

import {useEffect, useState} from 'react'
import {i18n} from '@lingui/core'
import {enUS as defaultLocale} from 'date-fns/locale/en-US'

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
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/es').then(m => m.es),
        import('@formatjs/intl-pluralrules/locale-data/an.js'),
        import('@formatjs/intl-numberformat/locale-data/an.js'),
        import('@formatjs/intl-displaynames/locale-data/an.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ast: {
      i18n.loadAndActivate({locale, messages: messagesAst})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/es').then(m => m.es),
        import('@formatjs/intl-pluralrules/locale-data/ast.js'),
        import('@formatjs/intl-numberformat/locale-data/ast.js'),
        import('@formatjs/intl-displaynames/locale-data/ast.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ca: {
      i18n.loadAndActivate({locale, messages: messagesCa})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/ca').then(m => m.ca),
        import('@formatjs/intl-pluralrules/locale-data/ca.js'),
        import('@formatjs/intl-numberformat/locale-data/ca.js'),
        import('@formatjs/intl-displaynames/locale-data/ca.js'),
      ])
      return dateLocale
    }
    case AppLanguage.cy: {
      i18n.loadAndActivate({locale, messages: messagesCy})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/cy').then(m => m.cy),
        import('@formatjs/intl-pluralrules/locale-data/cy.js'),
        import('@formatjs/intl-numberformat/locale-data/cy.js'),
        import('@formatjs/intl-displaynames/locale-data/cy.js'),
      ])
      return dateLocale
    }
    case AppLanguage.da: {
      i18n.loadAndActivate({locale, messages: messagesDa})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/da').then(m => m.da),
        import('@formatjs/intl-pluralrules/locale-data/da.js'),
        import('@formatjs/intl-numberformat/locale-data/da.js'),
        import('@formatjs/intl-displaynames/locale-data/da.js'),
      ])
      return dateLocale
    }
    case AppLanguage.de: {
      i18n.loadAndActivate({locale, messages: messagesDe})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/de').then(m => m.de),
        import('@formatjs/intl-pluralrules/locale-data/de.js'),
        import('@formatjs/intl-numberformat/locale-data/de.js'),
        import('@formatjs/intl-displaynames/locale-data/de.js'),
      ])
      return dateLocale
    }
    case AppLanguage.el: {
      i18n.loadAndActivate({locale, messages: messagesEl})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/el').then(m => m.el),
        import('@formatjs/intl-pluralrules/locale-data/el.js'),
        import('@formatjs/intl-numberformat/locale-data/el.js'),
        import('@formatjs/intl-displaynames/locale-data/el.js'),
      ])
      return dateLocale
    }
    case AppLanguage.en_GB: {
      i18n.loadAndActivate({locale, messages: messagesEn_GB})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/en-GB').then(m => m.enGB),
        import('@formatjs/intl-pluralrules/locale-data/en.js'),
        import('@formatjs/intl-numberformat/locale-data/en-GB.js'),
        import('@formatjs/intl-displaynames/locale-data/en-GB.js'),
      ])
      return dateLocale
    }
    case AppLanguage.eo: {
      i18n.loadAndActivate({locale, messages: messagesEo})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/eo').then(m => m.eo),
        import('@formatjs/intl-pluralrules/locale-data/eo.js'),
        import('@formatjs/intl-numberformat/locale-data/eo.js'),
        import('@formatjs/intl-displaynames/locale-data/eo.js'),
      ])
      return dateLocale
    }
    case AppLanguage.es: {
      i18n.loadAndActivate({locale, messages: messagesEs})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/es').then(m => m.es),
        import('@formatjs/intl-pluralrules/locale-data/es.js'),
        import('@formatjs/intl-numberformat/locale-data/es.js'),
        import('@formatjs/intl-displaynames/locale-data/es.js'),
      ])
      return dateLocale
    }
    case AppLanguage.eu: {
      i18n.loadAndActivate({locale, messages: messagesEu})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/eu').then(m => m.eu),
        import('@formatjs/intl-pluralrules/locale-data/eu.js'),
        import('@formatjs/intl-numberformat/locale-data/eu.js'),
        import('@formatjs/intl-displaynames/locale-data/eu.js'),
      ])
      return dateLocale
    }
    case AppLanguage.fi: {
      i18n.loadAndActivate({locale, messages: messagesFi})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/fi').then(m => m.fi),
        import('@formatjs/intl-pluralrules/locale-data/fi.js'),
        import('@formatjs/intl-numberformat/locale-data/fi.js'),
        import('@formatjs/intl-displaynames/locale-data/fi.js'),
      ])
      return dateLocale
    }
    case AppLanguage.fr: {
      i18n.loadAndActivate({locale, messages: messagesFr})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/fr').then(m => m.fr),
        import('@formatjs/intl-pluralrules/locale-data/fr.js'),
        import('@formatjs/intl-numberformat/locale-data/fr.js'),
        import('@formatjs/intl-displaynames/locale-data/fr.js'),
      ])
      return dateLocale
    }
    case AppLanguage.fy: {
      i18n.loadAndActivate({locale, messages: messagesFy})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/fy').then(m => m.fy),
        import('@formatjs/intl-pluralrules/locale-data/fy.js'),
        import('@formatjs/intl-numberformat/locale-data/fy.js'),
        import('@formatjs/intl-displaynames/locale-data/fy.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ga: {
      i18n.loadAndActivate({locale, messages: messagesGa})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ga.js'),
        import('@formatjs/intl-numberformat/locale-data/ga.js'),
        import('@formatjs/intl-displaynames/locale-data/ga.js'),
      ])
      return undefined
    }
    case AppLanguage.gd: {
      i18n.loadAndActivate({locale, messages: messagesGd})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/gd').then(m => m.gd),
        import('@formatjs/intl-pluralrules/locale-data/gd.js'),
        import('@formatjs/intl-numberformat/locale-data/gd.js'),
        import('@formatjs/intl-displaynames/locale-data/gd.js'),
      ])
      return dateLocale
    }
    case AppLanguage.gl: {
      i18n.loadAndActivate({locale, messages: messagesGl})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/gl').then(m => m.gl),
        import('@formatjs/intl-pluralrules/locale-data/gl.js'),
        import('@formatjs/intl-numberformat/locale-data/gl.js'),
        import('@formatjs/intl-displaynames/locale-data/gl.js'),
      ])
      return dateLocale
    }
    case AppLanguage.hi: {
      i18n.loadAndActivate({locale, messages: messagesHi})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/hi').then(m => m.hi),
        import('@formatjs/intl-pluralrules/locale-data/hi.js'),
        import('@formatjs/intl-numberformat/locale-data/hi.js'),
        import('@formatjs/intl-displaynames/locale-data/hi.js'),
      ])
      return dateLocale
    }
    case AppLanguage.hu: {
      i18n.loadAndActivate({locale, messages: messagesHu})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/hu').then(m => m.hu),
        import('@formatjs/intl-pluralrules/locale-data/hu.js'),
        import('@formatjs/intl-numberformat/locale-data/hu.js'),
        import('@formatjs/intl-displaynames/locale-data/hu.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ia: {
      i18n.loadAndActivate({locale, messages: messagesIa})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ia.js'),
        import('@formatjs/intl-numberformat/locale-data/ia.js'),
        import('@formatjs/intl-displaynames/locale-data/ia.js'),
      ])
      return undefined
    }
    case AppLanguage.id: {
      i18n.loadAndActivate({locale, messages: messagesId})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/id').then(m => m.id),
        import('@formatjs/intl-pluralrules/locale-data/id.js'),
        import('@formatjs/intl-numberformat/locale-data/id.js'),
        import('@formatjs/intl-displaynames/locale-data/id.js'),
      ])
      return dateLocale
    }
    case AppLanguage.it: {
      i18n.loadAndActivate({locale, messages: messagesIt})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/it').then(m => m.it),
        import('@formatjs/intl-pluralrules/locale-data/it.js'),
        import('@formatjs/intl-numberformat/locale-data/it.js'),
        import('@formatjs/intl-displaynames/locale-data/it.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ja: {
      i18n.loadAndActivate({locale, messages: messagesJa})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/ja').then(m => m.ja),
        import('@formatjs/intl-pluralrules/locale-data/ja.js'),
        import('@formatjs/intl-numberformat/locale-data/ja.js'),
        import('@formatjs/intl-displaynames/locale-data/ja.js'),
      ])
      return dateLocale
    }
    case AppLanguage.km: {
      i18n.loadAndActivate({locale, messages: messagesKm})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/km').then(m => m.km),
        import('@formatjs/intl-pluralrules/locale-data/km.js'),
        import('@formatjs/intl-numberformat/locale-data/km.js'),
        import('@formatjs/intl-displaynames/locale-data/km.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ko: {
      i18n.loadAndActivate({locale, messages: messagesKo})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/ko').then(m => m.ko),
        import('@formatjs/intl-pluralrules/locale-data/ko.js'),
        import('@formatjs/intl-numberformat/locale-data/ko.js'),
        import('@formatjs/intl-displaynames/locale-data/ko.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ne: {
      i18n.loadAndActivate({locale, messages: messagesNe})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ne.js'),
        import('@formatjs/intl-numberformat/locale-data/ne.js'),
        import('@formatjs/intl-displaynames/locale-data/ne.js'),
      ])
      return undefined
    }
    case AppLanguage.nl: {
      i18n.loadAndActivate({locale, messages: messagesNl})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/nl').then(m => m.nl),
        import('@formatjs/intl-pluralrules/locale-data/nl.js'),
        import('@formatjs/intl-numberformat/locale-data/nl.js'),
        import('@formatjs/intl-displaynames/locale-data/nl.js'),
      ])
      return dateLocale
    }
    case AppLanguage.pl: {
      i18n.loadAndActivate({locale, messages: messagesPl})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/pl').then(m => m.pl),
        import('@formatjs/intl-pluralrules/locale-data/pl.js'),
        import('@formatjs/intl-numberformat/locale-data/pl.js'),
        import('@formatjs/intl-displaynames/locale-data/pl.js'),
      ])
      return dateLocale
    }
    case AppLanguage.pt_BR: {
      i18n.loadAndActivate({locale, messages: messagesPt_BR})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/pt-BR').then(m => m.ptBR),
        import('@formatjs/intl-pluralrules/locale-data/pt.js'),
        import('@formatjs/intl-numberformat/locale-data/pt.js'),
        import('@formatjs/intl-displaynames/locale-data/pt.js'),
      ])
      return dateLocale
    }
    case AppLanguage.pt_PT: {
      i18n.loadAndActivate({locale, messages: messagesPt_PT})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/pt').then(m => m.pt),
        import('@formatjs/intl-pluralrules/locale-data/pt-PT.js'),
        import('@formatjs/intl-numberformat/locale-data/pt-PT.js'),
        import('@formatjs/intl-displaynames/locale-data/pt-PT.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ro: {
      i18n.loadAndActivate({locale, messages: messagesRo})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/ro').then(m => m.ro),
        import('@formatjs/intl-pluralrules/locale-data/ro.js'),
        import('@formatjs/intl-numberformat/locale-data/ro.js'),
        import('@formatjs/intl-displaynames/locale-data/ro.js'),
      ])
      return dateLocale
    }
    case AppLanguage.ru: {
      i18n.loadAndActivate({locale, messages: messagesRu})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/ru').then(m => m.ru),
        import('@formatjs/intl-pluralrules/locale-data/ru.js'),
        import('@formatjs/intl-numberformat/locale-data/ru.js'),
        import('@formatjs/intl-displaynames/locale-data/ru.js'),
      ])
      return dateLocale
    }
    case AppLanguage.sv: {
      i18n.loadAndActivate({locale, messages: messagesSv})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/sv').then(m => m.sv),
        import('@formatjs/intl-pluralrules/locale-data/sv.js'),
        import('@formatjs/intl-numberformat/locale-data/sv.js'),
        import('@formatjs/intl-displaynames/locale-data/sv.js'),
      ])
      return dateLocale
    }
    case AppLanguage.th: {
      i18n.loadAndActivate({locale, messages: messagesTh})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/th').then(m => m.th),
        import('@formatjs/intl-pluralrules/locale-data/th.js'),
        import('@formatjs/intl-numberformat/locale-data/th.js'),
        import('@formatjs/intl-displaynames/locale-data/th.js'),
      ])
      return dateLocale
    }
    case AppLanguage.tr: {
      i18n.loadAndActivate({locale, messages: messagesTr})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/tr').then(m => m.tr),
        import('@formatjs/intl-pluralrules/locale-data/tr.js'),
        import('@formatjs/intl-numberformat/locale-data/tr.js'),
        import('@formatjs/intl-displaynames/locale-data/tr.js'),
      ])
      return dateLocale
    }
    case AppLanguage.uk: {
      i18n.loadAndActivate({locale, messages: messagesUk})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/uk').then(m => m.uk),
        import('@formatjs/intl-pluralrules/locale-data/uk.js'),
        import('@formatjs/intl-numberformat/locale-data/uk.js'),
        import('@formatjs/intl-displaynames/locale-data/uk.js'),
      ])
      return dateLocale
    }
    case AppLanguage.vi: {
      i18n.loadAndActivate({locale, messages: messagesVi})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/vi').then(m => m.vi),
        import('@formatjs/intl-pluralrules/locale-data/vi.js'),
        import('@formatjs/intl-numberformat/locale-data/vi.js'),
        import('@formatjs/intl-displaynames/locale-data/vi.js'),
      ])
      return dateLocale
    }
    case AppLanguage.zh_CN: {
      i18n.loadAndActivate({locale, messages: messagesZh_CN})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/zh-CN').then(m => m.zhCN),
        import('@formatjs/intl-pluralrules/locale-data/zh.js'),
        import('@formatjs/intl-numberformat/locale-data/zh.js'),
        import('@formatjs/intl-displaynames/locale-data/zh.js'),
      ])
      return dateLocale
    }
    case AppLanguage.zh_HK: {
      i18n.loadAndActivate({locale, messages: messagesZh_HK})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/zh-HK').then(m => m.zhHK),
        import('@formatjs/intl-pluralrules/locale-data/zh.js'),
        import('@formatjs/intl-numberformat/locale-data/yue-Hant.js'),
        import('@formatjs/intl-displaynames/locale-data/yue-Hant.js'),
      ])
      return dateLocale
    }
    case AppLanguage.zh_TW: {
      i18n.loadAndActivate({locale, messages: messagesZh_TW})
      const [dateLocale] = await Promise.all([
        import('date-fns/locale/zh-TW').then(m => m.zhTW),
        import('@formatjs/intl-pluralrules/locale-data/zh.js'),
        import('@formatjs/intl-numberformat/locale-data/zh-Hant.js'),
        import('@formatjs/intl-displaynames/locale-data/zh-Hant.js'),
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
    void dynamicActivate(sanitizeAppLanguageSetting(appLanguage)).then(
      locale => {
        setDateLocale(locale ?? defaultLocale)
      },
    )
  }, [appLanguage])

  return dateLocale
}

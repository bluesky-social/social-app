import {useEffect, useState} from 'react'
import {i18n, type Messages} from '@lingui/core'
import {type Locale} from 'date-fns/locale'
import {enUS as defaultLocale} from 'date-fns/locale/en-US'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  let messages: Messages
  let dateLocale: Locale = defaultLocale

  switch (locale) {
    case AppLanguage.an: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/an/messages`).then(m => m.messages),
        import('date-fns/locale/es').then(m => m.es),
      ])
      break
    }
    case AppLanguage.ast: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/ast/messages`).then(m => m.messages),
        import('date-fns/locale/es').then(m => m.es),
      ])
      break
    }
    case AppLanguage.ca: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/ca/messages`).then(m => m.messages),
        import('date-fns/locale/ca').then(m => m.ca),
      ])
      break
    }
    case AppLanguage.cs: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/cs/messages`).then(m => m.messages),
        import('date-fns/locale/cs').then(m => m.cs),
      ])
      break
    }
    case AppLanguage.cy: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/cy/messages`).then(m => m.messages),
        import('date-fns/locale/cy').then(m => m.cy),
      ])
      break
    }
    case AppLanguage.da: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/da/messages`).then(m => m.messages),
        import('date-fns/locale/da').then(m => m.da),
      ])
      break
    }
    case AppLanguage.de: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/de/messages`).then(m => m.messages),
        import('date-fns/locale/de').then(m => m.de),
      ])
      break
    }
    case AppLanguage.el: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/el/messages`).then(m => m.messages),
        import('date-fns/locale/el').then(m => m.el),
      ])
      break
    }
    case AppLanguage.en_GB: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/en-GB/messages`).then(m => m.messages),
        import('date-fns/locale/en-GB').then(m => m.enGB),
      ])
      break
    }
    case AppLanguage.eo: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/eo/messages`).then(m => m.messages),
        import('date-fns/locale/eo').then(m => m.eo),
      ])
      break
    }
    case AppLanguage.es: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/es/messages`).then(m => m.messages),
        import('date-fns/locale/es').then(m => m.es),
      ])
      break
    }
    case AppLanguage.eu: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/eu/messages`).then(m => m.messages),
        import('date-fns/locale/eu').then(m => m.eu),
      ])
      break
    }
    case AppLanguage.fi: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/fi/messages`).then(m => m.messages),
        import('date-fns/locale/fi').then(m => m.fi),
      ])
      break
    }
    case AppLanguage.fr: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/fr/messages`).then(m => m.messages),
        import('date-fns/locale/fr').then(m => m.fr),
      ])
      break
    }
    case AppLanguage.fy: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/fy/messages`).then(m => m.messages),
        import('date-fns/locale/fy').then(m => m.fy),
      ])
      break
    }
    case AppLanguage.ga: {
      messages = await import(`./locales/ga/messages`).then(m => m.messages)
      break
    }
    case AppLanguage.gd: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/gd/messages`).then(m => m.messages),
        import('date-fns/locale/gd').then(m => m.gd),
      ])
      break
    }
    case AppLanguage.gl: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/gl/messages`).then(m => m.messages),
        import('date-fns/locale/gl').then(m => m.gl),
      ])
      break
    }
    case AppLanguage.hi: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/hi/messages`).then(m => m.messages),
        import('date-fns/locale/hi').then(m => m.hi),
      ])
      break
    }
    case AppLanguage.hu: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/hu/messages`).then(m => m.messages),
        import('date-fns/locale/hu').then(m => m.hu),
      ])
      break
    }
    case AppLanguage.ia: {
      messages = await import(`./locales/ia/messages`).then(m => m.messages)
      break
    }
    case AppLanguage.id: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/id/messages`).then(m => m.messages),
        import('date-fns/locale/id').then(m => m.id),
      ])
      break
    }
    case AppLanguage.it: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/it/messages`).then(m => m.messages),
        import('date-fns/locale/it').then(m => m.it),
      ])
      break
    }
    case AppLanguage.ja: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/ja/messages`).then(m => m.messages),
        import('date-fns/locale/ja').then(m => m.ja),
      ])
      break
    }
    case AppLanguage.km: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/km/messages`).then(m => m.messages),
        import('date-fns/locale/km').then(m => m.km),
      ])
      break
    }
    case AppLanguage.ko: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/ko/messages`).then(m => m.messages),
        import('date-fns/locale/ko').then(m => m.ko),
      ])
      break
    }
    case AppLanguage.ne: {
      messages = await import(`./locales/ne/messages`).then(m => m.messages)
      break
    }
    case AppLanguage.nl: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/nl/messages`).then(m => m.messages),
        import('date-fns/locale/nl').then(m => m.nl),
      ])
      break
    }
    case AppLanguage.pl: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/pl/messages`).then(m => m.messages),
        import('date-fns/locale/pl').then(m => m.pl),
      ])
      break
    }
    case AppLanguage.pt_BR: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/pt-BR/messages`).then(m => m.messages),
        import('date-fns/locale/pt-BR').then(m => m.ptBR),
      ])
      break
    }
    case AppLanguage.pt_PT: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/pt-PT/messages`).then(m => m.messages),
        import('date-fns/locale/pt').then(m => m.pt),
      ])
      break
    }
    case AppLanguage.ro: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/ro/messages`).then(m => m.messages),
        import('date-fns/locale/ro').then(m => m.ro),
      ])
      break
    }
    case AppLanguage.ru: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/ru/messages`).then(m => m.messages),
        import('date-fns/locale/ru').then(m => m.ru),
      ])
      break
    }
    case AppLanguage.sv: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/sv/messages`).then(m => m.messages),
        import('date-fns/locale/sv').then(m => m.sv),
      ])
      break
    }
    case AppLanguage.th: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/th/messages`).then(m => m.messages),
        import('date-fns/locale/th').then(m => m.th),
      ])
      break
    }
    case AppLanguage.tr: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/tr/messages`).then(m => m.messages),
        import('date-fns/locale/tr').then(m => m.tr),
      ])
      break
    }
    case AppLanguage.uk: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/uk/messages`).then(m => m.messages),
        import('date-fns/locale/uk').then(m => m.uk),
      ])
      break
    }
    case AppLanguage.vi: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/vi/messages`).then(m => m.messages),
        import('date-fns/locale/vi').then(m => m.vi),
      ])
      break
    }
    case AppLanguage.zh_CN: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/zh-CN/messages`).then(m => m.messages),
        import('date-fns/locale/zh-CN').then(m => m.zhCN),
      ])
      break
    }
    case AppLanguage.zh_HK: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/zh-HK/messages`).then(m => m.messages),
        import('date-fns/locale/zh-HK').then(m => m.zhHK),
      ])
      break
    }
    case AppLanguage.zh_TW: {
      ;[messages, dateLocale] = await Promise.all([
        import(`./locales/zh-TW/messages`).then(m => m.messages),
        import('date-fns/locale/zh-TW').then(m => m.zhTW),
      ])
      break
    }
    default: {
      messages = await import(`./locales/en/messages`).then(m => m.messages)
      break
    }
  }

  i18n.load(locale, messages)
  i18n.activate(locale)

  return dateLocale
}

export function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  const [dateLocale, setDateLocale] = useState(defaultLocale)

  useEffect(() => {
    const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage)

    document.documentElement.lang = sanitizedLanguage
    void dynamicActivate(sanitizedLanguage).then(locale => {
      setDateLocale(locale)
    })
  }, [appLanguage])

  return dateLocale
}

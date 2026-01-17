import {useEffect, useState} from 'react'
import {i18n} from '@lingui/core'
import defaultLocale from 'date-fns/locale/en-US'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  let mod: any
  let dateLocale: Locale = defaultLocale

  switch (locale) {
    case AppLanguage.an: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/an/messages`),
        import('date-fns/locale/es'),
      ])
      break
    }
    case AppLanguage.ast: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/ast/messages`),
        import('date-fns/locale/es'),
      ])
      break
    }
    case AppLanguage.ca: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/ca/messages`),
        import('date-fns/locale/ca'),
      ])
      break
    }
    case AppLanguage.cy: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/cy/messages`),
        import('date-fns/locale/cy'),
      ])
      break
    }
    case AppLanguage.da: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/da/messages`),
        import('date-fns/locale/da'),
      ])
      break
    }
    case AppLanguage.de: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/de/messages`),
        import('date-fns/locale/de'),
      ])
      break
    }
    case AppLanguage.el: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/el/messages`),
        import('date-fns/locale/el'),
      ])
      break
    }
    case AppLanguage.en_GB: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/en-GB/messages`),
        import('date-fns/locale/en-GB'),
      ])
      break
    }
    case AppLanguage.eo: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/eo/messages`),
        import('date-fns/locale/eo'),
      ])
      break
    }
    case AppLanguage.es: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/es/messages`),
        import('date-fns/locale/es'),
      ])
      break
    }
    case AppLanguage.eu: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/eu/messages`),
        import('date-fns/locale/eu'),
      ])
      break
    }
    case AppLanguage.fi: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/fi/messages`),
        import('date-fns/locale/fi'),
      ])
      break
    }
    case AppLanguage.fr: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/fr/messages`),
        import('date-fns/locale/fr'),
      ])
      break
    }
    case AppLanguage.fy: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/fy/messages`),
        import('date-fns/locale/fy'),
      ])
      break
    }
    case AppLanguage.ga: {
      mod = await import(`./locales/ga/messages`)
      break
    }
    case AppLanguage.gd: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/gd/messages`),
        import('date-fns/locale/gd'),
      ])
      break
    }
    case AppLanguage.gl: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/gl/messages`),
        import('date-fns/locale/gl'),
      ])
      break
    }
    case AppLanguage.hi: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/hi/messages`),
        import('date-fns/locale/hi'),
      ])
      break
    }
    case AppLanguage.hu: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/hu/messages`),
        import('date-fns/locale/hu'),
      ])
      break
    }
    case AppLanguage.ia: {
      mod = await import(`./locales/ia/messages`)
      break
    }
    case AppLanguage.id: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/id/messages`),
        import('date-fns/locale/id'),
      ])
      break
    }
    case AppLanguage.it: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/it/messages`),
        import('date-fns/locale/it'),
      ])
      break
    }
    case AppLanguage.ja: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/ja/messages`),
        import('date-fns/locale/ja'),
      ])
      break
    }
    case AppLanguage.km: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/km/messages`),
        import('date-fns/locale/km'),
      ])
      break
    }
    case AppLanguage.ko: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/ko/messages`),
        import('date-fns/locale/ko'),
      ])
      break
    }
    case AppLanguage.ne: {
      mod = await import(`./locales/ne/messages`)
      break
    }
    case AppLanguage.nl: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/nl/messages`),
        import('date-fns/locale/nl'),
      ])
      break
    }
    case AppLanguage.pl: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/pl/messages`),
        import('date-fns/locale/pl'),
      ])
      break
    }
    case AppLanguage.pt_BR: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/pt-BR/messages`),
        import('date-fns/locale/pt-BR'),
      ])
      break
    }
    case AppLanguage.pt_PT: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/pt-PT/messages`),
        import('date-fns/locale/pt'),
      ])
      break
    }
    case AppLanguage.ro: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/ro/messages`),
        import('date-fns/locale/ro'),
      ])
      break
    }
    case AppLanguage.ru: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/ru/messages`),
        import('date-fns/locale/ru'),
      ])
      break
    }
    case AppLanguage.sv: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/sv/messages`),
        import('date-fns/locale/sv'),
      ])
      break
    }
    case AppLanguage.th: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/th/messages`),
        import('date-fns/locale/th'),
      ])
      break
    }
    case AppLanguage.tr: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/tr/messages`),
        import('date-fns/locale/tr'),
      ])
      break
    }
    case AppLanguage.uk: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/uk/messages`),
        import('date-fns/locale/uk'),
      ])
      break
    }
    case AppLanguage.vi: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/vi/messages`),
        import('date-fns/locale/vi'),
      ])
      break
    }
    case AppLanguage.zh_CN: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/zh-CN/messages`),
        import('date-fns/locale/zh-CN'),
      ])
      break
    }
    case AppLanguage.zh_HK: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/zh-HK/messages`),
        import('date-fns/locale/zh-HK'),
      ])
      break
    }
    case AppLanguage.zh_TW: {
      ;[mod, {default: dateLocale}] = await Promise.all([
        import(`./locales/zh-TW/messages`),
        import('date-fns/locale/zh-TW'),
      ])
      break
    }
    default: {
      mod = await import(`./locales/en/messages`)
      break
    }
  }

  i18n.load(locale, mod.messages)
  i18n.activate(locale)

  return dateLocale
}

export function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  const [dateLocale, setDateLocale] = useState(defaultLocale)

  useEffect(() => {
    const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage)

    document.documentElement.lang = sanitizedLanguage
    dynamicActivate(sanitizedLanguage).then(locale => {
      setDateLocale(locale)
    })
  }, [appLanguage])

  return dateLocale
}

import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  let mod: any

  switch (locale) {
    case AppLanguage.an: {
      mod = await import(`./locales/an/messages`)
      break
    }
    case AppLanguage.ast: {
      mod = await import(`./locales/ast/messages`)
      break
    }
    case AppLanguage.ca: {
      mod = await import(`./locales/ca/messages`)
      break
    }
    case AppLanguage.da: {
      mod = await import(`./locales/da/messages`)
      break
    }
    case AppLanguage.de: {
      mod = await import(`./locales/de/messages`)
      break
    }
    case AppLanguage.el: {
      mod = await import(`./locales/el/messages`)
      break
    }
    case AppLanguage.en_GB: {
      mod = await import(`./locales/en-GB/messages`)
      break
    }
    case AppLanguage.es: {
      mod = await import(`./locales/es/messages`)
      break
    }
    case AppLanguage.eu: {
      mod = await import(`./locales/eu/messages`)
      break
    }
    case AppLanguage.fi: {
      mod = await import(`./locales/fi/messages`)
      break
    }
    case AppLanguage.fr: {
      mod = await import(`./locales/fr/messages`)
      break
    }
    case AppLanguage.ga: {
      mod = await import(`./locales/ga/messages`)
      break
    }
    case AppLanguage.gl: {
      mod = await import(`./locales/gl/messages`)
      break
    }
    case AppLanguage.hi: {
      mod = await import(`./locales/hi/messages`)
      break
    }
    case AppLanguage.hu: {
      mod = await import(`./locales/hu/messages`)
      break
    }
    case AppLanguage.ia: {
      mod = await import(`./locales/ia/messages`)
      break
    }
    case AppLanguage.id: {
      mod = await import(`./locales/id/messages`)
      break
    }
    case AppLanguage.it: {
      mod = await import(`./locales/it/messages`)
      break
    }
    case AppLanguage.ja: {
      mod = await import(`./locales/ja/messages`)
      break
    }
    case AppLanguage.km: {
      mod = await import(`./locales/km/messages`)
      break
    }
    case AppLanguage.ko: {
      mod = await import(`./locales/ko/messages`)
      break
    }
    case AppLanguage.ne: {
      mod = await import(`./locales/ne/messages`)
      break
    }
    case AppLanguage.nl: {
      mod = await import(`./locales/nl/messages`)
      break
    }
    case AppLanguage.pl: {
      mod = await import(`./locales/pl/messages`)
      break
    }
    case AppLanguage.pt_BR: {
      mod = await import(`./locales/pt-BR/messages`)
      break
    }
    case AppLanguage.ro: {
      mod = await import(`./locales/ro/messages`)
      break
    }
    case AppLanguage.ru: {
      mod = await import(`./locales/ru/messages`)
      break
    }
    case AppLanguage.sv: {
      mod = await import(`./locales/sv/messages`)
      break
    }
    case AppLanguage.th: {
      mod = await import(`./locales/th/messages`)
      break
    }
    case AppLanguage.tr: {
      mod = await import(`./locales/tr/messages`)
      break
    }
    case AppLanguage.uk: {
      mod = await import(`./locales/uk/messages`)
      break
    }
    case AppLanguage.vi: {
      mod = await import(`./locales/vi/messages`)
      break
    }
    case AppLanguage.zh_CN: {
      mod = await import(`./locales/zh-CN/messages`)
      break
    }
    case AppLanguage.zh_HK: {
      mod = await import(`./locales/zh-HK/messages`)
      break
    }
    case AppLanguage.zh_TW: {
      mod = await import(`./locales/zh-TW/messages`)
      break
    }
    default: {
      mod = await import(`./locales/en/messages`)
      break
    }
  }

  i18n.load(locale, mod.messages)
  i18n.activate(locale)
}

export async function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  useEffect(() => {
    const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage)

    document.documentElement.lang = sanitizedLanguage
    dynamicActivate(sanitizedLanguage)
  }, [appLanguage])
}

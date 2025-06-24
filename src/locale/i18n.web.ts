import {useEffect} from 'react'
import {i18n} from '@lingui/core'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * We do a dynamic import of just the catalog that we need
 *
 * IMPORTANT: Imports should be prefixed with '@lingui/loader!'
 * for the Lingui webpack loader to work
 */
export async function dynamicActivate(locale: AppLanguage) {
  let mod: any

  switch (locale) {
    case AppLanguage.an: {
      mod = await import(`@lingui/loader!./locales/an/messages.po`)
      break
    }
    case AppLanguage.ast: {
      mod = await import(`@lingui/loader!./locales/ast/messages.po`)
      break
    }
    case AppLanguage.ca: {
      mod = await import(`@lingui/loader!./locales/ca/messages.po`)
      break
    }
    case AppLanguage.cy: {
      mod = await import(`@lingui/loader!./locales/cy/messages.po`)
      break
    }
    case AppLanguage.da: {
      mod = await import(`@lingui/loader!./locales/da/messages.po`)
      break
    }
    case AppLanguage.de: {
      mod = await import(`@lingui/loader!./locales/de/messages.po`)
      break
    }
    case AppLanguage.el: {
      mod = await import(`@lingui/loader!./locales/el/messages.po`)
      break
    }
    case AppLanguage.en_GB: {
      mod = await import(`@lingui/loader!./locales/en-GB/messages.po`)
      break
    }
    case AppLanguage.eo: {
      mod = await import(`@lingui/loader!./locales/eo/messages.po`)
      break
    }
    case AppLanguage.es: {
      mod = await import(`@lingui/loader!./locales/es/messages.po`)
      break
    }
    case AppLanguage.eu: {
      mod = await import(`@lingui/loader!./locales/eu/messages.po`)
      break
    }
    case AppLanguage.fi: {
      mod = await import(`@lingui/loader!./locales/fi/messages.po`)
      break
    }
    case AppLanguage.fr: {
      mod = await import(`@lingui/loader!./locales/fr/messages.po`)
      break
    }
    case AppLanguage.fy: {
      mod = await import(`@lingui/loader!./locales/fy/messages.po`)
      break
    }
    case AppLanguage.ga: {
      mod = await import(`@lingui/loader!./locales/ga/messages.po`)
      break
    }
    case AppLanguage.gd: {
      mod = await import(`@lingui/loader!./locales/gd/messages.po`)
      break
    }
    case AppLanguage.gl: {
      mod = await import(`@lingui/loader!./locales/gl/messages.po`)
      break
    }
    case AppLanguage.hi: {
      mod = await import(`@lingui/loader!./locales/hi/messages.po`)
      break
    }
    case AppLanguage.hu: {
      mod = await import(`@lingui/loader!./locales/hu/messages.po`)
      break
    }
    case AppLanguage.ia: {
      mod = await import(`@lingui/loader!./locales/ia/messages.po`)
      break
    }
    case AppLanguage.id: {
      mod = await import(`@lingui/loader!./locales/id/messages.po`)
      break
    }
    case AppLanguage.it: {
      mod = await import(`@lingui/loader!./locales/it/messages.po`)
      break
    }
    case AppLanguage.ja: {
      mod = await import(`@lingui/loader!./locales/ja/messages.po`)
      break
    }
    case AppLanguage.km: {
      mod = await import(`@lingui/loader!./locales/km/messages.po`)
      break
    }
    case AppLanguage.ko: {
      mod = await import(`@lingui/loader!./locales/ko/messages.po`)
      break
    }
    case AppLanguage.ne: {
      mod = await import(`@lingui/loader!./locales/ne/messages.po`)
      break
    }
    case AppLanguage.nl: {
      mod = await import(`@lingui/loader!./locales/nl/messages.po`)
      break
    }
    case AppLanguage.pl: {
      mod = await import(`@lingui/loader!./locales/pl/messages.po`)
      break
    }
    case AppLanguage.pt_BR: {
      mod = await import(`@lingui/loader!./locales/pt-BR/messages.po`)
      break
    }
    case AppLanguage.pt_PT: {
      mod = await import(`@lingui/loader!./locales/pt-PT/messages.po`)
      break
    }
    case AppLanguage.ro: {
      mod = await import(`@lingui/loader!./locales/ro/messages.po`)
      break
    }
    case AppLanguage.ru: {
      mod = await import(`@lingui/loader!./locales/ru/messages.po`)
      break
    }
    case AppLanguage.sv: {
      mod = await import(`@lingui/loader!./locales/sv/messages.po`)
      break
    }
    case AppLanguage.th: {
      mod = await import(`@lingui/loader!./locales/th/messages.po`)
      break
    }
    case AppLanguage.tr: {
      mod = await import(`@lingui/loader!./locales/tr/messages.po`)
      break
    }
    case AppLanguage.uk: {
      mod = await import(`@lingui/loader!./locales/uk/messages.po`)
      break
    }
    case AppLanguage.vi: {
      mod = await import(`@lingui/loader!./locales/vi/messages.po`)
      break
    }
    case AppLanguage.zh_CN: {
      mod = await import(`@lingui/loader!./locales/zh-CN/messages.po`)
      break
    }
    case AppLanguage.zh_HK: {
      mod = await import(`@lingui/loader!./locales/zh-HK/messages.po`)
      break
    }
    case AppLanguage.zh_TW: {
      mod = await import(`@lingui/loader!./locales/zh-TW/messages.po`)
      break
    }
    default: {
      mod = await import(`@lingui/loader!./locales/en/messages.po`)
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

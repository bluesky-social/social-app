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
import messagesAn from '#/locale/locales/an/messages'
import messagesAst from '#/locale/locales/ast/messages'
import messagesCa from '#/locale/locales/ca/messages'
import messagesCy from '#/locale/locales/cy/messages'
import messagesDa from '#/locale/locales/da/messages'
import messagesDe from '#/locale/locales/de/messages'
import messagesEl from '#/locale/locales/el/messages'
import messagesEn from '#/locale/locales/en/messages'
import messagesEn_GB from '#/locale/locales/en-GB/messages'
import messagesEo from '#/locale/locales/eo/messages'
import messagesEs from '#/locale/locales/es/messages'
import messagesEu from '#/locale/locales/eu/messages'
import messagesFi from '#/locale/locales/fi/messages'
import messagesFr from '#/locale/locales/fr/messages'
import messagesFy from '#/locale/locales/fy/messages'
import messagesGa from '#/locale/locales/ga/messages'
import messagesGd from '#/locale/locales/gd/messages'
import messagesGl from '#/locale/locales/gl/messages'
import messagesHi from '#/locale/locales/hi/messages'
import messagesHu from '#/locale/locales/hu/messages'
import messagesIa from '#/locale/locales/ia/messages'
import messagesId from '#/locale/locales/id/messages'
import messagesIt from '#/locale/locales/it/messages'
import messagesJa from '#/locale/locales/ja/messages'
import messagesKm from '#/locale/locales/km/messages'
import messagesKo from '#/locale/locales/ko/messages'
import messagesNe from '#/locale/locales/ne/messages'
import messagesNl from '#/locale/locales/nl/messages'
import messagesPl from '#/locale/locales/pl/messages'
import messagesPt_BR from '#/locale/locales/pt-BR/messages'
import messagesPt_PT from '#/locale/locales/pt-PT/messages'
import messagesRo from '#/locale/locales/ro/messages'
import messagesRu from '#/locale/locales/ru/messages'
import messagesSv from '#/locale/locales/sv/messages'
import messagesTh from '#/locale/locales/th/messages'
import messagesTr from '#/locale/locales/tr/messages'
import messagesUk from '#/locale/locales/uk/messages'
import messagesVi from '#/locale/locales/vi/messages'
import messagesZh_CN from '#/locale/locales/zh-CN/messages'
import messagesZh_HK from '#/locale/locales/zh-HK/messages'
import messagesZh_TW from '#/locale/locales/zh-TW/messages'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  switch (locale) {
    case AppLanguage.an: {
      i18n.loadAndActivate({locale, messages: messagesAn.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/an'),
        import('@formatjs/intl-numberformat/locale-data/es'),
      ])
      break
    }
    case AppLanguage.ast: {
      i18n.loadAndActivate({locale, messages: messagesAst.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ast'),
        import('@formatjs/intl-numberformat/locale-data/ast'),
      ])
      break
    }
    case AppLanguage.ca: {
      i18n.loadAndActivate({locale, messages: messagesCa.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ca'),
        import('@formatjs/intl-numberformat/locale-data/ca'),
      ])
      break
    }
    case AppLanguage.cy: {
      i18n.loadAndActivate({locale, messages: messagesCy.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/cy'),
        import('@formatjs/intl-numberformat/locale-data/cy'),
      ])
      break
    }
    case AppLanguage.da: {
      i18n.loadAndActivate({locale, messages: messagesDa.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/da'),
        import('@formatjs/intl-numberformat/locale-data/da'),
      ])
      break
    }
    case AppLanguage.de: {
      i18n.loadAndActivate({locale, messages: messagesDe.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/de'),
        import('@formatjs/intl-numberformat/locale-data/de'),
      ])
      break
    }
    case AppLanguage.el: {
      i18n.loadAndActivate({locale, messages: messagesEl.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/el'),
        import('@formatjs/intl-numberformat/locale-data/el'),
      ])
      break
    }
    case AppLanguage.en_GB: {
      i18n.loadAndActivate({locale, messages: messagesEn_GB.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/en'),
        import('@formatjs/intl-numberformat/locale-data/en-GB'),
      ])
      break
    }
    case AppLanguage.eo: {
      i18n.loadAndActivate({locale, messages: messagesEo.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/eo'),
        import('@formatjs/intl-numberformat/locale-data/eo'),
      ])
      break
    }
    case AppLanguage.es: {
      i18n.loadAndActivate({locale, messages: messagesEs.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/es'),
        import('@formatjs/intl-numberformat/locale-data/es'),
      ])
      break
    }
    case AppLanguage.eu: {
      i18n.loadAndActivate({locale, messages: messagesEu.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/eu'),
        import('@formatjs/intl-numberformat/locale-data/eu'),
      ])
      break
    }
    case AppLanguage.fi: {
      i18n.loadAndActivate({locale, messages: messagesFi.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/fi'),
        import('@formatjs/intl-numberformat/locale-data/fi'),
      ])
      break
    }
    case AppLanguage.fr: {
      i18n.loadAndActivate({locale, messages: messagesFr.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/fr'),
        import('@formatjs/intl-numberformat/locale-data/fr'),
      ])
      break
    }
    case AppLanguage.fy: {
      i18n.loadAndActivate({locale, messages: messagesFy.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/fy'),
        import('@formatjs/intl-numberformat/locale-data/fy'),
      ])
      break
    }
    case AppLanguage.ga: {
      i18n.loadAndActivate({locale, messages: messagesGa.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ga'),
        import('@formatjs/intl-numberformat/locale-data/ga'),
      ])
      break
    }
    case AppLanguage.gd: {
      i18n.loadAndActivate({locale, messages: messagesGd.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/gd'),
        import('@formatjs/intl-numberformat/locale-data/gd'),
      ])
      break
    }
    case AppLanguage.gl: {
      i18n.loadAndActivate({locale, messages: messagesGl.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/gl'),
        import('@formatjs/intl-numberformat/locale-data/gl'),
      ])
      break
    }
    case AppLanguage.hi: {
      i18n.loadAndActivate({locale, messages: messagesHi.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/hi'),
        import('@formatjs/intl-numberformat/locale-data/hi'),
      ])
      break
    }
    case AppLanguage.hu: {
      i18n.loadAndActivate({locale, messages: messagesHu.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/hu'),
        import('@formatjs/intl-numberformat/locale-data/hu'),
      ])
      break
    }
    case AppLanguage.ia: {
      i18n.loadAndActivate({locale, messages: messagesIa.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ia'),
        import('@formatjs/intl-numberformat/locale-data/ia'),
      ])
      break
    }
    case AppLanguage.id: {
      i18n.loadAndActivate({locale, messages: messagesId.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/id'),
        import('@formatjs/intl-numberformat/locale-data/id'),
      ])
      break
    }
    case AppLanguage.it: {
      i18n.loadAndActivate({locale, messages: messagesIt.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/it'),
        import('@formatjs/intl-numberformat/locale-data/it'),
      ])
      break
    }
    case AppLanguage.ja: {
      i18n.loadAndActivate({locale, messages: messagesJa.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ja'),
        import('@formatjs/intl-numberformat/locale-data/ja'),
      ])
      break
    }
    case AppLanguage.km: {
      i18n.loadAndActivate({locale, messages: messagesKm.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/km'),
        import('@formatjs/intl-numberformat/locale-data/km'),
      ])
      break
    }
    case AppLanguage.ko: {
      i18n.loadAndActivate({locale, messages: messagesKo.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ko'),
        import('@formatjs/intl-numberformat/locale-data/ko'),
      ])
      break
    }
    case AppLanguage.ne: {
      i18n.loadAndActivate({locale, messages: messagesNe.messages})
      break
    }
    case AppLanguage.nl: {
      i18n.loadAndActivate({locale, messages: messagesNl.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/nl'),
        import('@formatjs/intl-numberformat/locale-data/nl'),
      ])
      break
    }
    case AppLanguage.pl: {
      i18n.loadAndActivate({locale, messages: messagesPl.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/pl'),
        import('@formatjs/intl-numberformat/locale-data/pl'),
      ])
      break
    }
    case AppLanguage.pt_BR: {
      i18n.loadAndActivate({locale, messages: messagesPt_BR.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/pt'),
        import('@formatjs/intl-numberformat/locale-data/pt'),
      ])
      break
    }
    case AppLanguage.pt_PT: {
      i18n.loadAndActivate({locale, messages: messagesPt_PT.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/pt-PT'),
        import('@formatjs/intl-numberformat/locale-data/pt-PT'),
      ])
      break
    }
    case AppLanguage.ro: {
      i18n.loadAndActivate({locale, messages: messagesRo.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ro'),
        import('@formatjs/intl-numberformat/locale-data/ro'),
      ])
      break
    }
    case AppLanguage.ru: {
      i18n.loadAndActivate({locale, messages: messagesRu.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/ru'),
        import('@formatjs/intl-numberformat/locale-data/ru'),
      ])
      break
    }
    case AppLanguage.sv: {
      i18n.loadAndActivate({locale, messages: messagesSv.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/sv'),
        import('@formatjs/intl-numberformat/locale-data/sv'),
      ])
      break
    }
    case AppLanguage.th: {
      i18n.loadAndActivate({locale, messages: messagesTh.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/th'),
        import('@formatjs/intl-numberformat/locale-data/th'),
      ])
      break
    }
    case AppLanguage.tr: {
      i18n.loadAndActivate({locale, messages: messagesTr.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/tr'),
        import('@formatjs/intl-numberformat/locale-data/tr'),
      ])
      break
    }
    case AppLanguage.uk: {
      i18n.loadAndActivate({locale, messages: messagesUk.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/uk'),
        import('@formatjs/intl-numberformat/locale-data/uk'),
      ])
      break
    }
    case AppLanguage.vi: {
      i18n.loadAndActivate({locale, messages: messagesVi.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/vi'),
        import('@formatjs/intl-numberformat/locale-data/vi'),
      ])
      break
    }
    case AppLanguage.zh_CN: {
      i18n.loadAndActivate({locale, messages: messagesZh_CN.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
      ])
      break
    }
    case AppLanguage.zh_HK: {
      i18n.loadAndActivate({locale, messages: messagesZh_HK.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
      ])
      break
    }
    case AppLanguage.zh_TW: {
      i18n.loadAndActivate({locale, messages: messagesZh_TW.messages})
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/zh'),
        import('@formatjs/intl-numberformat/locale-data/zh'),
      ])
      break
    }
    default: {
      i18n.loadAndActivate({locale, messages: messagesEn.messages})
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

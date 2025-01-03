import {i18n, type Messages} from '@lingui/core'

import {AppLanguage} from './languages'

/**
 * We do a dynamic import of just the catalog that we need
 */
export async function dynamicActivate(locale: AppLanguage) {
  let mod: { messages: Messages }

  switch (locale) {
    case AppLanguage.en: {
      mod = await import(`./locales/en/messages`)
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

function findSupportedAppLanguage(): AppLanguage {
  const queryLanguage = new URLSearchParams(window.location.search).get('language')
  const languages = [queryLanguage, queryLanguage?.replace(/-.*/, ''), ...navigator.languages, 'en']
  return languages.find(language => language && (language in AppLanguage)) as AppLanguage
}

export const appLanguage = findSupportedAppLanguage()

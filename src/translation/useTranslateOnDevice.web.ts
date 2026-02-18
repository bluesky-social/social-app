import {useCallback} from 'react'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {getTranslatorLink} from '#/locale/helpers'
import {useLanguagePrefs} from '#/state/preferences'
import {useAnalytics} from '#/analytics'

const translationState = {status: 'idle'} // No on-device translations for web.

const clearTranslation = () => {} // no-op on web

/**
 * Web always opens Google Translate.
 */
export function useTranslateOnDevice(_key: string) {
  const openLink = useOpenLink()
  const ax = useAnalytics()
  const {primaryLanguage} = useLanguagePrefs()

  const translate = useCallback(
    async (
      text: string,
      targetLangCode: string = primaryLanguage,
      sourceLangCode: string,
    ) => {
      const translateUrl = getTranslatorLink(
        text,
        targetLangCode,
        sourceLangCode,
      )
      ax.metric('translate:result', {method: 'google-translate'})
      await openLink(translateUrl)
    },
    [ax, openLink, primaryLanguage],
  )
  return {clearTranslation, translate, translationState}
}

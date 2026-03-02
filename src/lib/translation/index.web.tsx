import {useCallback, useContext, useMemo} from 'react'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {getTranslatorLink} from '#/locale/helpers'
import {useLanguagePrefs} from '#/state/preferences'
import {useAnalytics} from '#/analytics'
import {Context} from './context'
import {type Options, type TranslationState} from './types'

const translationState: Record<string, TranslationState> = {}
const acquireTranslation = (_key: string) => {
  return () => {}
}
const clearTranslation = (_key: string) => {}

export function useTranslationKey(_key: string) {}

/**
 * Web always opens Google Translate.
 */
export function useTranslateOnDevice() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslateOnDevice must be used within a TranslateOnDeviceProvider',
    )
  }
  return context
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const openLink = useOpenLink()
  const ax = useAnalytics()
  const {primaryLanguage} = useLanguagePrefs()

  const translate = useCallback(
    async (
      _key: string,
      text: string,
      targetLangCode: string = primaryLanguage,
      sourceLangCode?: string,
      _options?: Options,
    ) => {
      ax.metric('translate:result', {
        method: 'google-translate',
        os: 'web',
        sourceLanguage: sourceLangCode ?? null,
        targetLanguage: targetLangCode,
      })
      const translateUrl = getTranslatorLink(
        text,
        targetLangCode,
        sourceLangCode,
      )
      await openLink(translateUrl)
    },
    [ax, openLink, primaryLanguage],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [translate],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
